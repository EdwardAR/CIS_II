const { db } = require('../../config/db');
const { addMinutesToTime, getDayOfWeek } = require('../../utils/date');

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
  `SELECT a.id, a.status, p.user_id AS patient_user_id, d.user_id AS doctor_user_id
   FROM appointments a
   INNER JOIN patients p ON p.id = a.patient_id
   INNER JOIN doctors d ON d.id = a.doctor_id
   WHERE a.id = ?`
);

function getPatientByUser(userId) {
  return findPatientByUserStmt.get(userId);
}

function listAppointmentsForRole(user) {
  if (user.role === 'admin') {
    return listAppointmentsAdminStmt.all();
  }

  if (user.role === 'medico') {
    const doctor = findDoctorByUserStmt.get(user.id);
    if (!doctor) return [];
    return listAppointmentsByDoctorStmt.all(doctor.id);
  }

  const patient = getPatientByUser(user.id);
  if (!patient) return [];

  return listAppointmentsByPatientStmt.all(patient.id);
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

function requestAppointmentReschedule(appointmentId, currentUser) {
  if (!currentUser || currentUser.role !== 'paciente') {
    throw new Error('Solo el paciente puede solicitar reprogramacion.');
  }

  const appointment = getAppointmentByIdStmt.get(appointmentId);
  if (!appointment || appointment.patient_user_id !== currentUser.id) {
    throw new Error('No se encontro la cita para solicitar reprogramacion.');
  }

  if (appointment.status !== 'pendiente') {
    throw new Error('Solo se pueden solicitar reprogramaciones en citas pendientes.');
  }

  updateAppointmentStatus(appointmentId, 'solicitud_reprogramacion');
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

  updateAppointmentStatus(appointmentId, 'reprogramada');
}

module.exports = {
  listAppointmentsForRole,
  getDoctorOptions,
  getDoctorSpecialties,
  getDoctorOptionsBySpecialty,
  getDoctorById,
  getDoctorSchedule,
  getAvailableSlots,
  createAppointment,
  updateAppointmentStatus,
  requestAppointmentReschedule,
  approveAppointmentReschedule
};