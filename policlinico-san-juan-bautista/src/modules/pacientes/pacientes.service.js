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

module.exports = { getPatientProfileByUserId, updatePatientProfile };