const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { db } = require('../config/db');

function initDatabase() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@policlinico.pe');
  if (!adminExists) {
    const defaultPasswordHash = bcrypt.hashSync('Admin123*', 10);

    const seedDefaults = db.transaction(() => {
      const insertUser = db.prepare(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)'
      );

      const adminResult = insertUser.run(
        'Administrador General',
        'admin@policlinico.pe',
        defaultPasswordHash,
        'admin'
      );

      const doctorUserResult = insertUser.run(
        'Dra. Ana Torres',
        'ana.torres@policlinico.pe',
        defaultPasswordHash,
        'medico'
      );

      const doctorResult = db
        .prepare('INSERT INTO doctors (user_id, specialty, license_number, office) VALUES (?, ?, ?, ?)')
        .run(doctorUserResult.lastInsertRowid, 'Medicina General', 'CMP-00123', 'Consultorio 101');

      db.prepare(
        'INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_minutes, is_active) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(doctorResult.lastInsertRowid, 1, '08:00', '12:00', 30, 1);

      return adminResult.lastInsertRowid;
    });

    const adminId = seedDefaults();

    console.log('Base de datos inicializada con usuarios por defecto.');
    console.log('Admin: admin@policlinico.pe / Admin123*');
    console.log('Medico: ana.torres@policlinico.pe / Admin123*');
    console.log(`Admin ID creado: ${adminId}`);
  }
}

module.exports = { initDatabase };