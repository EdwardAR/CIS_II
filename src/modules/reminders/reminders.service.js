const { db } = require('../../config/db');
const { formatIsoDateToDmy } = require('../../utils/date');

function formatLocalDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function buildReminderText(item, role) {
  const appointmentDate = formatIsoDateToDmy(item.appointment_date);
  const appointmentTime = item.start_time;

  if (role === 'medico') {
    return `${item.patient_name} tiene cita contigo el ${appointmentDate} a las ${appointmentTime}.`;
  }

  if (role === 'admin') {
    return `${item.patient_name} con ${item.doctor_name} tiene cita el ${appointmentDate} a las ${appointmentTime}.`;
  }

  return `Tienes cita con ${item.doctor_name} el ${appointmentDate} a las ${appointmentTime}.`;
}

function getAutomaticReminders(currentUser) {
  if (!currentUser) return [];

  const now = new Date();
  const limitDateTime = new Date(now);
  limitDateTime.setHours(limitDateTime.getHours() + 24);

  const nowIso = formatLocalDateTime(now);
  const limitIso = formatLocalDateTime(limitDateTime);

  let rows = [];

  if (currentUser.role === 'admin') {
    rows = db
      .prepare(
        `SELECT a.id, a.appointment_date, a.start_time, a.status,
                up.full_name AS patient_name, ud.full_name AS doctor_name, d.specialty
         FROM appointments a
         INNER JOIN patients p ON p.id = a.patient_id
         INNER JOIN users up ON up.id = p.user_id
         INNER JOIN doctors d ON d.id = a.doctor_id
         INNER JOIN users ud ON ud.id = d.user_id
         WHERE datetime(a.appointment_date || ' ' || a.start_time) BETWEEN datetime(?) AND datetime(?)
           AND a.status IN ('pendiente', 'solicitud_reprogramacion')
         ORDER BY a.appointment_date ASC, a.start_time ASC
         LIMIT 3`
      )
      .all(nowIso, limitIso);
  } else if (currentUser.role === 'medico') {
    rows = db
      .prepare(
        `SELECT a.id, a.appointment_date, a.start_time, a.status,
                up.full_name AS patient_name, ud.full_name AS doctor_name, d.specialty
         FROM appointments a
         INNER JOIN patients p ON p.id = a.patient_id
         INNER JOIN users up ON up.id = p.user_id
         INNER JOIN doctors d ON d.id = a.doctor_id
         INNER JOIN users ud ON ud.id = d.user_id
         WHERE d.user_id = ?
           AND datetime(a.appointment_date || ' ' || a.start_time) BETWEEN datetime(?) AND datetime(?)
           AND a.status IN ('pendiente', 'solicitud_reprogramacion')
         ORDER BY a.appointment_date ASC, a.start_time ASC
         LIMIT 3`
      )
      .all(currentUser.id, nowIso, limitIso);
  } else if (currentUser.role === 'paciente') {
    rows = db
      .prepare(
        `SELECT a.id, a.appointment_date, a.start_time, a.status,
                up.full_name AS patient_name, ud.full_name AS doctor_name, d.specialty
         FROM appointments a
         INNER JOIN patients p ON p.id = a.patient_id
         INNER JOIN users up ON up.id = p.user_id
         INNER JOIN doctors d ON d.id = a.doctor_id
         INNER JOIN users ud ON ud.id = d.user_id
         WHERE p.user_id = ?
           AND datetime(a.appointment_date || ' ' || a.start_time) BETWEEN datetime(?) AND datetime(?)
           AND a.status IN ('pendiente', 'solicitud_reprogramacion')
         ORDER BY a.appointment_date ASC, a.start_time ASC
         LIMIT 3`
      )
      .all(currentUser.id, nowIso, limitIso);
  }

  return rows.map((item) => ({
    id: item.id,
    appointmentDate: item.appointment_date,
    appointmentTime: item.start_time,
    status: item.status,
    title:
      item.status === 'solicitud_reprogramacion'
        ? 'Reprogramación pendiente'
        : currentUser.role === 'admin'
          ? 'Cita próxima'
          : currentUser.role === 'medico'
            ? 'Atención próxima'
            : 'Tu cita próxima',
    message: buildReminderText(item, currentUser.role),
    urgency: item.status === 'solicitud_reprogramacion' ? 'warning' : 'info'
  }));
}

module.exports = { getAutomaticReminders };