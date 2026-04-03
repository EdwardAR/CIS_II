const { db } = require('../../config/db');
const { addMinutesToTime, getDayOfWeek } = require('../../utils/date');

function getPatientByUser(userId) {
  return db.prepare('SELECT id FROM patients WHERE user_id = ?').get(userId);
}

function listAppointmentsForRole(user) {
  if (user.role === 'admin') {
    return db
      .prepare(
        `SELECT a.id, a.appointment_date, a.start_time, a.end_time, a.status,
                up.full_name AS patient_name, ud.full_name AS doctor_name, d.specialty
         FROM appointments a
         INNER JOIN patients p ON p.id = a.patient_id
         INNER JOIN users up ON up.id = p.user_id
         INNER JOIN doctors d ON d.id = a.doctor_id
         INNER JOIN users ud ON ud.id = d.user_id
         ORDER BY a.appointment_date DESC, a.start_time DESC`
      )
      .all();
  }

  if (user.role === 'medico') {
    const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id);
    if (!doctor) return [];
    return db
      .prepare(
        `SELECT a.id, a.appointment_date, a.start_time, a.end_time, a.status,
                up.full_name AS patient_name, ud.full_name AS doctor_name, d.specialty
         FROM appointments a
         INNER JOIN patients p ON p.id = a.patient_id
         INNER JOIN users up ON up.id = p.user_id
         INNER JOIN doctors d ON d.id = a.doctor_id
         INNER JOIN users ud ON ud.id = d.user_id
         WHERE a.doctor_id = ?
         ORDER BY a.appointment_date DESC, a.start_time DESC`
      )
      .all(doctor.id);
  }

  const patient = getPatientByUser(user.id);
  if (!patient) return [];

  return db
    .prepare(
      `SELECT a.id, a.appointment_date, a.start_time, a.end_time, a.status,
              up.full_name AS patient_name, ud.full_name AS doctor_name, d.specialty
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN users up ON up.id = p.user_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       INNER JOIN users ud ON ud.id = d.user_id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC, a.start_time DESC`
    )
    .all(patient.id);
}

function getDoctorOptions() {
  return db
    .prepare(
      `SELECT d.id, u.full_name, d.specialty
       FROM doctors d
       INNER JOIN users u ON u.id = d.user_id
       ORDER BY u.full_name ASC`
    )
    .all();
}

function getAvailableSlots(doctorId, date) {
  const dayOfWeek = getDayOfWeek(date);
  const schedule = db
    .prepare(
      'SELECT * FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ? AND is_active = 1 LIMIT 1'
    )
    .get(doctorId, dayOfWeek);

  if (!schedule) return [];

  const appointments = db
    .prepare('SELECT start_time FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status = ?')
    .all(doctorId, date, 'pendiente')
    .map((a) => a.start_time);

  const slots = [];
  let current = schedule.start_time;

  while (current < schedule.end_time) {
    if (!appointments.includes(current)) {
      slots.push(current);
    }
    current = addMinutesToTime(current, schedule.slot_minutes);
  }

  return slots;
}

function createAppointment(payload, currentUser) {
  const patient = getPatientByUser(currentUser.id);
  if (!patient) {
    throw new Error('Perfil de paciente no encontrado.');
  }

  const existing = db
    .prepare(
      'SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND start_time = ? AND status = ?'
    )
    .get(payload.doctor_id, payload.appointment_date, payload.start_time, 'pendiente');

  if (existing) {
    throw new Error('El horario seleccionado ya fue reservado.');
  }

  const schedule = db
    .prepare(
      'SELECT slot_minutes FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ? AND is_active = 1 LIMIT 1'
    )
    .get(payload.doctor_id, getDayOfWeek(payload.appointment_date));

  if (!schedule) {
    throw new Error('El medico no atiende en esa fecha.');
  }

  const endTime = addMinutesToTime(payload.start_time, schedule.slot_minutes);

  db.prepare(
    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, status, reason, created_by_user_id)
     VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?)`
  ).run(patient.id, payload.doctor_id, payload.appointment_date, payload.start_time, endTime, payload.reason, currentUser.id);
}

function updateAppointmentStatus(appointmentId, status) {
  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, appointmentId);
}

module.exports = {
  listAppointmentsForRole,
  getDoctorOptions,
  getAvailableSlots,
  createAppointment,
  updateAppointmentStatus
};