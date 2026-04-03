const { db } = require('../../config/db');

function getSummary() {
  const total = db.prepare('SELECT COUNT(*) as total FROM appointments').get().total;
  const pending = db
    .prepare("SELECT COUNT(*) as total FROM appointments WHERE status = 'pendiente'")
    .get().total;
  const completed = db
    .prepare("SELECT COUNT(*) as total FROM appointments WHERE status = 'completada'")
    .get().total;
  const cancelled = db
    .prepare("SELECT COUNT(*) as total FROM appointments WHERE status = 'cancelada'")
    .get().total;

  const upcoming = db
    .prepare(
      `SELECT a.id, a.appointment_date, a.start_time, a.status,
              up.full_name AS patient_name, ud.full_name AS doctor_name, d.specialty
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN users up ON up.id = p.user_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       INNER JOIN users ud ON ud.id = d.user_id
       ORDER BY a.appointment_date ASC, a.start_time ASC
       LIMIT 10`
    )
    .all();

  return { total, pending, completed, cancelled, upcoming };
}

module.exports = { getSummary };