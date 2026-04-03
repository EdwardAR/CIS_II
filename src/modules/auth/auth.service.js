const bcrypt = require('bcrypt');
const { db } = require('../../config/db');

function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
}

function createPatientUser(payload) {
  const passwordHash = bcrypt.hashSync(payload.password, 10);

  const insertUser = db.prepare(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  const insertPatient = db.prepare(
    'INSERT INTO patients (user_id, dni, phone, birth_date, address, emergency_contact) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const tx = db.transaction(() => {
    const result = insertUser.run(payload.full_name, payload.email, passwordHash, 'paciente');
    insertPatient.run(
      result.lastInsertRowid,
      payload.dni,
      payload.phone,
      payload.birth_date || null,
      payload.address || null,
      payload.emergency_contact || null
    );
    return result.lastInsertRowid;
  });

  return tx();
}

function validatePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

module.exports = { findUserByEmail, createPatientUser, validatePassword };