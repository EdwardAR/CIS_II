const { db } = require('../../config/db');
const { addMinutesToTime, getDayOfWeek, formatIsoDateToDmy } = require('../../utils/date');
const {
  createNotificationForUser,
  createNotificationsForRole
} = require('../notificaciones/notificaciones.service');

const ALLOWED_APPOINTMENT_STATUSES = new Set([
  'pendiente',
  'completada',
  'cancelada',
  'reprogramada',
  'solicitud_reprogramacion'
]);

const findPatientByUserStmt = db.prepare('SELECT id FROM patients WHERE user_id = ?');
const findDoctorByUserStmt = db.prepare('SELECT id FROM doctors WHERE user_id = ?');

const listAppointmentsBase = `SELECT a.id, a.appointment_date, a.start_time, a.end_time, a.status,
                                     up.full_name AS patient_name, ud.full_name AS doctor_name, d.specialty, d.office AS doctor_office
                              FROM appointments a
                              INNER JOIN patients p ON p.id = a.patient_id
                              INNER JOIN users up ON up.id = p.user_id
                              INNER JOIN doctors d ON d.id = a.doctor_id
                              INNER JOIN users ud ON ud.id = d.user_id`;

const listAppointmentsAdminStmt = db.prepare(
  `${listAppointmentsBase}
   ORDER BY a.appointment_date DESC, a.start_time DESC`
);

const listAppointmentsByDoctorStmt = db.prepare(
  `${listAppointmentsBase}
   WHERE a.doctor_id = ?
   ORDER BY a.appointment_date DESC, a.start_time DESC`
);

const listAppointmentsByPatientStmt = db.prepare(
  `${listAppointmentsBase}
   WHERE a.patient_id = ?
   ORDER BY a.appointment_date DESC, a.start_time DESC`
);

const availableScheduleStmt = db.prepare(
  'SELECT start_time, end_time, slot_minutes FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ? AND is_active = 1 LIMIT 1'
);

const pendingAppointmentsByDateStmt = db.prepare(
  'SELECT start_time FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status = ?'
);

const pendingAppointmentExistsStmt = db.prepare(
  'SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND start_time = ? AND status = ?'
);

const listDoctorSchedulesStmt = db.prepare(
  `SELECT day_of_week, start_time, end_time, slot_minutes
   FROM doctor_schedules
   WHERE doctor_id = ? AND is_active = 1
   ORDER BY day_of_week ASC, start_time ASC`
);

const getDoctorByIdStmt = db.prepare(
  `SELECT d.id, u.full_name, d.specialty, d.office
   FROM doctors d
   INNER JOIN users u ON u.id = d.user_id
   WHERE d.id = ?`
);

const insertAppointmentStmt = db.prepare(
  `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, status, reason, created_by_user_id)
   VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?)`
);

const updateAppointmentStatusStmt = db.prepare('UPDATE appointments SET status = ? WHERE id = ?');
const getAppointmentByIdStmt = db.prepare(
  `SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.start_time, a.end_time, a.reason,
          a.status, p.user_id AS patient_user_id, d.user_id AS doctor_user_id,
          up.full_name AS patient_name, ud.full_name AS doctor_name, d.office AS doctor_office
   FROM appointments a
   INNER JOIN patients p ON p.id = a.patient_id
   INNER JOIN doctors d ON d.id = a.doctor_id
   INNER JOIN users up ON up.id = p.user_id
   INNER JOIN users ud ON ud.id = d.user_id
   WHERE a.id = ?`
);

const getAppointmentRatingStmt = db.prepare(
  `SELECT id, appointment_id, patient_user_id, doctor_user_id, rating, comment
   FROM appointment_ratings
   WHERE appointment_id = ?
   LIMIT 1`
);

const upsertAppointmentRatingStmt = db.prepare(
  `INSERT INTO appointment_ratings (
    appointment_id,
    patient_user_id,
    doctor_user_id,
    rating,
    comment,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, datetime('now'))
   ON CONFLICT(appointment_id) DO UPDATE SET
     patient_user_id = excluded.patient_user_id,
     doctor_user_id = excluded.doctor_user_id,
     rating = excluded.rating,
     comment = excluded.comment,
     updated_at = datetime('now')`
);

const listPendingRatingsForPatientStmt = db.prepare(
  `SELECT a.id, a.appointment_date, a.start_time, a.end_time,
          ud.full_name AS doctor_name, d.specialty, d.office AS doctor_office
   FROM appointments a
   INNER JOIN patients p ON p.id = a.patient_id
   INNER JOIN doctors d ON d.id = a.doctor_id
   INNER JOIN users ud ON ud.id = d.user_id
   LEFT JOIN appointment_ratings ar ON ar.appointment_id = a.id
   WHERE p.user_id = ?
     AND a.status = 'completada'
     AND ar.id IS NULL
   ORDER BY a.appointment_date DESC, a.start_time DESC`
);

const listDoctorSchedulesByDayStmt = db.prepare(
  `SELECT day_of_week, start_time, end_time, slot_minutes
   FROM doctor_schedules
   WHERE doctor_id = ? AND is_active = 1
   ORDER BY day_of_week ASC, start_time ASC`
);

const listBusySlotsByDateStmt = db.prepare(
  `SELECT start_time
   FROM appointments
  WHERE doctor_id = ? AND appointment_date = ?`
);

const insertApprovedRescheduleStmt = db.prepare(
  `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, status, reason, created_by_user_id)
   VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?)`
);

const insertRescheduleAuditStmt = db.prepare(
  `INSERT INTO appointment_reschedule_audit (
    original_appointment_id,
    new_appointment_id,
    requested_by_user_id,
    approved_by_user_id,
    old_status,
    new_status,
    note
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`
);

const getRescheduleAuditByNewAppointmentStmt = db.prepare(
  `SELECT original_appointment_id, new_appointment_id
   FROM appointment_reschedule_audit
   WHERE new_appointment_id = ?
   LIMIT 1`
);

function getPatientByUser(userId) {
  return findPatientByUserStmt.get(userId);
}

function isAutoRescheduledAppointment(appointmentId) {
  return !!getRescheduleAuditByNewAppointmentStmt.get(appointmentId);
}

function enrichAppointmentsWithRescheduleFlags(appointments) {
  return appointments.map((appointment) => {
    const audit = getRescheduleAuditByNewAppointmentStmt.get(appointment.id);
    return {
      ...appointment,
      is_auto_rescheduled: !!audit,
      reschedule_origin_appointment_id: audit ? audit.original_appointment_id : null
    };
  });
}

function listAppointmentsForRole(user) {
  if (user.role === 'admin') {
    return enrichAppointmentsWithRescheduleFlags(listAppointmentsAdminStmt.all());
  }

  if (user.role === 'medico') {
    const doctor = findDoctorByUserStmt.get(user.id);
    if (!doctor) return [];
    return enrichAppointmentsWithRescheduleFlags(listAppointmentsByDoctorStmt.all(doctor.id));
  }

  const patient = getPatientByUser(user.id);
  if (!patient) return [];

  return enrichAppointmentsWithRescheduleFlags(listAppointmentsByPatientStmt.all(patient.id));
}

function getDoctorOptions() {
  return db
    .prepare(
      `SELECT d.id, u.full_name, d.specialty
              , d.office
       FROM doctors d
       INNER JOIN users u ON u.id = d.user_id
       ORDER BY u.full_name ASC`
    )
    .all();
}

function getDoctorSpecialties() {
  return db
    .prepare(
      `SELECT DISTINCT specialty
       FROM doctors
       WHERE specialty IS NOT NULL AND trim(specialty) <> ''
       ORDER BY specialty ASC`
    )
    .all()
    .map((row) => row.specialty);
}

function getDoctorOptionsBySpecialty(specialty) {
  if (!specialty) {
    return getDoctorOptions();
  }

  return db
    .prepare(
      `SELECT d.id, u.full_name, d.specialty
              , d.office
       FROM doctors d
       INNER JOIN users u ON u.id = d.user_id
       WHERE d.specialty = ?
       ORDER BY u.full_name ASC`
    )
    .all(specialty);
}

function getAvailableSlots(doctorId, date) {
  const dayOfWeek = getDayOfWeek(date);
  const schedule = availableScheduleStmt.get(doctorId, dayOfWeek);

  if (!schedule || schedule.slot_minutes <= 0) return [];

  const reservedStarts = new Set(
    pendingAppointmentsByDateStmt
      .all(doctorId, date, 'pendiente')
      .map((appointment) => appointment.start_time)
  );

  const slots = [];
  let current = schedule.start_time;

  while (current < schedule.end_time) {
    if (!reservedStarts.has(current)) {
      slots.push(current);
    }
    current = addMinutesToTime(current, schedule.slot_minutes);
  }

  return slots;
}

function getDoctorSchedule(doctorId) {
  if (!doctorId) return [];
  return listDoctorSchedulesStmt.all(doctorId);
}

function getDoctorById(doctorId) {
  if (!doctorId) return null;
  return getDoctorByIdStmt.get(doctorId);
}

function getPendingRatingsForPatient(currentUser) {
  if (!currentUser || currentUser.role !== 'paciente') {
    return [];
  }

  return listPendingRatingsForPatientStmt.all(currentUser.id).map((item) => ({
    ...item,
    appointment_label: `${formatIsoDateToDmy(item.appointment_date)} - ${item.start_time}`
  }));
}

function createAppointment(payload, currentUser) {
  const patient = getPatientByUser(currentUser.id);
  if (!patient) {
    throw new Error('Perfil de paciente no encontrado.');
  }

  const existing = pendingAppointmentExistsStmt.get(
    payload.doctor_id,
    payload.appointment_date,
    payload.start_time,
    'pendiente'
  );

  if (existing) {
    throw new Error('El horario seleccionado ya fue reservado.');
  }

  const schedule = availableScheduleStmt.get(payload.doctor_id, getDayOfWeek(payload.appointment_date));

  if (!schedule) {
    throw new Error('El medico no atiende en esa fecha.');
  }

  const endTime = addMinutesToTime(payload.start_time, schedule.slot_minutes);

  insertAppointmentStmt.run(
    patient.id,
    payload.doctor_id,
    payload.appointment_date,
    payload.start_time,
    endTime,
    payload.reason,
    currentUser.id
  );
}

function updateAppointmentStatus(appointmentId, status) {
  if (!ALLOWED_APPOINTMENT_STATUSES.has(status)) {
    throw new Error('Estado de cita no permitido.');
  }

  updateAppointmentStatusStmt.run(status, appointmentId);
}

function completeAppointment(appointmentId, currentUser) {
  if (!currentUser || !['admin', 'medico'].includes(currentUser.role)) {
    throw new Error('No tienes permisos para completar esta cita.');
  }

  const appointment = getAppointmentByIdStmt.get(appointmentId);
  if (!appointment) {
    throw new Error('No se encontro la cita solicitada.');
  }

  if (currentUser.role === 'medico' && appointment.doctor_user_id !== currentUser.id) {
    throw new Error('No tienes permiso para completar esta cita.');
  }

  if (appointment.status !== 'pendiente') {
    throw new Error('Solo se pueden completar citas pendientes.');
  }

  const appointmentLabel = `${formatIsoDateToDmy(appointment.appointment_date)} a las ${appointment.start_time}`;

  const runCompletion = db.transaction(() => {
    updateAppointmentStatusStmt.run('completada', appointmentId);

    createNotificationForUser(appointment.patient_user_id, {
      appointmentId,
      type: 'success',
      title: 'Tu cita fue completada',
      message: `Tu cita con ${appointment.doctor_name} del ${appointmentLabel} fue marcada como completada. Califica la atención de 1 a 5 estrellas.`,
      actionUrl: `/citas#calificacion-${appointment.id}`,
      actionLabel: 'Calificar ahora'
    });

    createNotificationsForRole('admin', {
      appointmentId,
      type: 'info',
      title: 'Atención completada, espera de calificación',
      message: `${appointment.patient_name} con ${appointment.doctor_name} completó su cita del ${appointmentLabel}. Revisa la satisfacción del servicio.`,
      actionUrl: '/admin#satisfaccion',
      actionLabel: 'Ver satisfacción'
    });

    return {
      appointmentId,
      patientName: appointment.patient_name,
      doctorName: appointment.doctor_name,
      appointmentDate: appointment.appointment_date,
      startTime: appointment.start_time
    };
  });

  return runCompletion();
}

function cancelAppointment(appointmentId, currentUser) {
  if (!currentUser || !['admin', 'medico', 'paciente'].includes(currentUser.role)) {
    throw new Error('No tienes permisos para cancelar esta cita.');
  }

  const appointment = getAppointmentByIdStmt.get(appointmentId);
  if (!appointment) {
    throw new Error('No se encontro la cita solicitada.');
  }

  if (appointment.status !== 'pendiente') {
    throw new Error('Solo se pueden cancelar citas pendientes.');
  }

  const appointmentLabel = `${formatIsoDateToDmy(appointment.appointment_date)} a las ${appointment.start_time}`;

  const runCancellation = db.transaction(() => {
    updateAppointmentStatusStmt.run('cancelada', appointmentId);

    const notifyDoctor = currentUser.role !== 'medico' || currentUser.id !== appointment.doctor_user_id;
    if (notifyDoctor) {
      const cancelMessage =
        currentUser.role === 'paciente'
          ? `El paciente ${appointment.patient_name} canceló la cita del ${appointmentLabel}.`
          : `La cita de ${appointment.patient_name} con ${appointment.doctor_name} fue cancelada para el ${appointmentLabel}.`;

      createNotificationForUser(appointment.doctor_user_id, {
        appointmentId,
        type: 'warning',
        title: 'Cita cancelada',
        message: cancelMessage,
        actionUrl: '/citas',
        actionLabel: 'Revisar agenda'
      });
    }

    return {
      appointmentId,
      patientName: appointment.patient_name,
      doctorName: appointment.doctor_name,
      appointmentDate: appointment.appointment_date,
      startTime: appointment.start_time
    };
  });

  return runCancellation();
}

function requestAppointmentReschedule(appointmentId, currentUser) {
  if (!currentUser || currentUser.role !== 'paciente') {
    throw new Error('Solo el paciente puede solicitar reprogramacion.');
  }

  const appointment = getAppointmentByIdStmt.get(appointmentId);
  if (!appointment || appointment.patient_user_id !== currentUser.id) {
    throw new Error('No se encontro la cita para solicitar reprogramacion.');
  }

  if (isAutoRescheduledAppointment(appointmentId)) {
    throw new Error('Esta cita ya fue generada por una reprogramacion anterior y no puede volver a reprogramarse desde el paciente.');
  }

  if (appointment.status !== 'pendiente') {
    throw new Error('Solo se pueden solicitar reprogramaciones en citas pendientes.');
  }

  updateAppointmentStatus(appointmentId, 'solicitud_reprogramacion');
}

function rateAppointment(appointmentId, currentUser, rating, comment = '') {
  if (!currentUser || currentUser.role !== 'paciente') {
    throw new Error('Solo el paciente puede calificar una cita.');
  }

  const appointment = getAppointmentByIdStmt.get(appointmentId);
  if (!appointment || appointment.patient_user_id !== currentUser.id) {
    throw new Error('No se encontro la cita para calificar.');
  }

  if (appointment.status !== 'completada') {
    throw new Error('Solo se pueden calificar citas completadas.');
  }

  const existingRating = getAppointmentRatingStmt.get(appointmentId);
  const cleanComment = String(comment || '').trim();

  const runRating = db.transaction(() => {
    upsertAppointmentRatingStmt.run(
      appointmentId,
      currentUser.id,
      appointment.doctor_user_id,
      rating,
      cleanComment || null
    );

    if (!existingRating) {
      const satisfactionType = rating >= 4 ? 'success' : rating === 3 ? 'warning' : 'danger';

      createNotificationsForRole('admin', {
        appointmentId,
        type: satisfactionType,
        title: 'Nueva calificación de atención',
        message: `${appointment.patient_name} calificó con ${rating} estrella(s) la atención de ${appointment.doctor_name} para la cita del ${formatIsoDateToDmy(appointment.appointment_date)} a las ${appointment.start_time}.`,
        actionUrl: '/admin#satisfaccion',
        actionLabel: 'Revisar satisfacción'
      });
    }

    return {
      appointmentId,
      rating,
      doctorName: appointment.doctor_name,
      patientName: appointment.patient_name,
      appointmentDate: appointment.appointment_date,
      startTime: appointment.start_time,
      isUpdate: !!existingRating
    };
  });

  return runRating();
}

function formatDateIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateFromIso(isoDate) {
  return new Date(`${isoDate}T00:00:00`);
}

function findNextAvailableSlot(doctorId, baseDate) {
  const schedules = listDoctorSchedulesByDayStmt.all(doctorId);
  if (!schedules.length) {
    throw new Error('El medico no tiene horarios activos para reprogramar.');
  }

  const maxLookAheadDays = 90;
  const base = toDateFromIso(baseDate);

  for (let offset = 1; offset <= maxLookAheadDays; offset += 1) {
    const candidate = new Date(base);
    candidate.setDate(base.getDate() + offset);
    const candidateDate = formatDateIso(candidate);
    const day = candidate.getDay();

    const daySchedules = schedules.filter((item) => item.day_of_week === day);
    if (!daySchedules.length) {
      continue;
    }

    const busyStarts = new Set(listBusySlotsByDateStmt.all(doctorId, candidateDate).map((item) => item.start_time));

    for (const schedule of daySchedules) {
      let start = schedule.start_time;

      while (start < schedule.end_time) {
        if (!busyStarts.has(start)) {
          return {
            appointmentDate: candidateDate,
            startTime: start,
            endTime: addMinutesToTime(start, schedule.slot_minutes)
          };
        }

        start = addMinutesToTime(start, schedule.slot_minutes);
      }
    }
  }

  throw new Error('No se encontro un horario disponible para reprogramar en los proximos 90 dias.');
}

function approveAppointmentReschedule(appointmentId, currentUser) {
  if (!currentUser || !['admin', 'medico'].includes(currentUser.role)) {
    throw new Error('Solo medico o administrador pueden aprobar reprogramacion.');
  }

  const appointment = getAppointmentByIdStmt.get(appointmentId);
  if (!appointment) {
    throw new Error('No se encontro la cita solicitada.');
  }

  if (currentUser.role === 'medico' && appointment.doctor_user_id !== currentUser.id) {
    throw new Error('No tienes permiso para aprobar esta reprogramacion.');
  }

  if (appointment.status !== 'solicitud_reprogramacion') {
    throw new Error('La cita no tiene una solicitud de reprogramacion pendiente.');
  }

  const nextSlot = findNextAvailableSlot(appointment.doctor_id, appointment.appointment_date);

  const runApproval = db.transaction(() => {
    updateAppointmentStatusStmt.run('reprogramada', appointmentId);

    const created = insertApprovedRescheduleStmt.run(
      appointment.patient_id,
      appointment.doctor_id,
      nextSlot.appointmentDate,
      nextSlot.startTime,
      nextSlot.endTime,
      appointment.reason,
      currentUser.id
    );

    insertRescheduleAuditStmt.run(
      appointmentId,
      created.lastInsertRowid,
      appointment.patient_user_id,
      currentUser.id,
      'solicitud_reprogramacion',
      'reprogramada',
      `Nueva cita automatica: ${nextSlot.appointmentDate} ${nextSlot.startTime}-${nextSlot.endTime}`
    );

    return {
      originalAppointmentId: appointmentId,
      newAppointmentId: Number(created.lastInsertRowid),
      appointmentDate: nextSlot.appointmentDate,
      startTime: nextSlot.startTime,
      endTime: nextSlot.endTime
    };
  });

  return runApproval();
}

module.exports = {
  listAppointmentsForRole,
  getDoctorOptions,
  getDoctorSpecialties,
  getDoctorOptionsBySpecialty,
  getDoctorById,
  getPendingRatingsForPatient,
  getDoctorSchedule,
  getAvailableSlots,
  createAppointment,
  updateAppointmentStatus,
  completeAppointment,
  cancelAppointment,
  requestAppointmentReschedule,
  approveAppointmentReschedule,
  isAutoRescheduledAppointment,
  rateAppointment
};