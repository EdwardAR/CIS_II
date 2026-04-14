const { db } = require('../../config/db');

function getSummary() {
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todayDayOfWeek = now.getDay();

  const total = db.prepare('SELECT COUNT(*) as total FROM appointments').get().total;
  const totalDoctors = db.prepare('SELECT COUNT(*) as total FROM doctors').get().total;
  const totalPatients = db.prepare('SELECT COUNT(*) as total FROM patients').get().total;
  const pending = db
    .prepare("SELECT COUNT(*) as total FROM appointments WHERE status = 'pendiente'")
    .get().total;
  const completed = db
    .prepare("SELECT COUNT(*) as total FROM appointments WHERE status = 'completada'")
    .get().total;
  const cancelled = db
    .prepare("SELECT COUNT(*) as total FROM appointments WHERE status = 'cancelada'")
    .get().total;
  const today = db
    .prepare('SELECT COUNT(*) as total FROM appointments WHERE appointment_date = DATE(\'now\', \'localtime\')')
    .get().total;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const todayPending = db
    .prepare("SELECT COUNT(*) as total FROM appointments WHERE appointment_date = ? AND status = 'pendiente'")
    .get(todayIso).total;
  const todayCompleted = db
    .prepare("SELECT COUNT(*) as total FROM appointments WHERE appointment_date = ? AND status = 'completada'")
    .get(todayIso).total;
  const todayCancelled = db
    .prepare("SELECT COUNT(*) as total FROM appointments WHERE appointment_date = ? AND status = 'cancelada'")
    .get(todayIso).total;

  const upcoming = db
    .prepare(
      `SELECT a.id, a.appointment_date, a.start_time, a.status,
              up.full_name AS patient_name, ud.full_name AS doctor_name, d.specialty, d.office AS doctor_office
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN users up ON up.id = p.user_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       INNER JOIN users ud ON ud.id = d.user_id
       WHERE a.appointment_date > ?
          OR (a.appointment_date = ? AND a.start_time >= ?)
       ORDER BY a.appointment_date ASC, a.start_time ASC
       LIMIT 10`
    )
    .all(todayIso, todayIso, currentTime);

  const nextAppointment = upcoming[0] || null;

  const doctorsInShiftNow = db
    .prepare(
      `SELECT COUNT(DISTINCT d.id) AS total
       FROM doctors d
       INNER JOIN doctor_schedules s ON s.doctor_id = d.id
       WHERE s.is_active = 1
         AND s.day_of_week = ?
         AND s.start_time <= ?
         AND s.end_time > ?`
    )
    .get(todayDayOfWeek, currentTime, currentTime).total;

  const doctorsWithAppointmentsToday = db
    .prepare(
      `SELECT COUNT(DISTINCT a.doctor_id) AS total
       FROM appointments a
       WHERE a.appointment_date = ?
         AND a.status = 'pendiente'`
    )
    .get(todayIso).total;

  const pendingBySpecialty = db
    .prepare(
      `SELECT d.specialty, COUNT(*) AS total
       FROM appointments a
       INNER JOIN doctors d ON d.id = a.doctor_id
       WHERE a.status = 'pendiente'
         AND a.appointment_date >= ?
       GROUP BY d.specialty
       ORDER BY total DESC, d.specialty ASC
       LIMIT 5`
    )
    .all(todayIso);

  const todayPendingDetails = db
    .prepare(
      `SELECT a.appointment_date,
              a.start_time,
              a.end_time,
              up.full_name AS patient_name,
              ud.full_name AS doctor_name,
              d.specialty,
              d.office AS doctor_office
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN users up ON up.id = p.user_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       INNER JOIN users ud ON ud.id = d.user_id
       WHERE a.appointment_date = ?
         AND a.status = 'pendiente'
       ORDER BY a.start_time ASC
       LIMIT 8`
    )
    .all(todayIso);

  return {
    todayIso,
    total,
    totalDoctors,
    totalPatients,
    pending,
    completed,
    cancelled,
    today,
    todayPending,
    todayCompleted,
    todayCancelled,
    completionRate,
    upcoming,
    nextAppointment,
    doctorsInShiftNow,
    doctorsWithAppointmentsToday,
    pendingBySpecialty,
    todayPendingDetails
  };
}

module.exports = { getSummary };