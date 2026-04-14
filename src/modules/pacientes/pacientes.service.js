const { db } = require('../../config/db');

function getPatientProfileByUserId(userId) {
  return db
    .prepare(
      `SELECT u.id as user_id, u.full_name, u.email, p.id as patient_id, p.dni, p.phone,
              p.birth_date, p.address, p.emergency_contact
       FROM users u
       INNER JOIN patients p ON p.user_id = u.id
       WHERE u.id = ?`
    )
    .get(userId);
}

function updatePatientProfile(userId, payload) {
  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(payload.full_name, userId);
    db.prepare('UPDATE patients SET phone = ?, address = ?, emergency_contact = ? WHERE user_id = ?').run(
      payload.phone,
      payload.address,
      payload.emergency_contact || null,
      userId
    );
  });

  tx();
}

function getDoctorAvailabilitySnapshot(now = new Date()) {
  const dayOfWeek = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const rows = db
    .prepare(
      `SELECT d.id,
              u.full_name,
              d.specialty,
              d.office,
              EXISTS(
                SELECT 1
                FROM doctor_schedules s
                WHERE s.doctor_id = d.id
                  AND s.is_active = 1
                  AND s.day_of_week = ?
                  AND s.start_time <= ?
                  AND s.end_time > ?
              ) AS is_in_shift,
              (
                SELECT MIN(s2.start_time)
                FROM doctor_schedules s2
                WHERE s2.doctor_id = d.id
                  AND s2.is_active = 1
                  AND s2.day_of_week = ?
              ) AS first_start,
              (
                SELECT MAX(s3.end_time)
                FROM doctor_schedules s3
                WHERE s3.doctor_id = d.id
                  AND s3.is_active = 1
                  AND s3.day_of_week = ?
              ) AS last_end
       FROM doctors d
       INNER JOIN users u ON u.id = d.user_id
       ORDER BY d.specialty ASC, u.full_name ASC`
    )
    .all(dayOfWeek, currentTime, currentTime, dayOfWeek, dayOfWeek);

  return rows.map((row) => ({
    ...row,
    is_in_shift: row.is_in_shift === 1,
    today_schedule: row.first_start && row.last_end ? `${row.first_start} - ${row.last_end}` : 'Sin turno hoy'
  }));
}

module.exports = { getPatientProfileByUserId, updatePatientProfile, getDoctorAvailabilitySnapshot };