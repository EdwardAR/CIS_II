const bcrypt = require('bcrypt');
const { db } = require('../../config/db');

const listDoctorsBaseQuery = `SELECT d.id, u.full_name, u.email, d.specialty, d.license_number, d.office
                              FROM doctors d
                              INNER JOIN users u ON u.id = d.user_id`;

const listDoctorsStmt = db.prepare(`${listDoctorsBaseQuery} ORDER BY u.full_name ASC`);

const listDoctorsBySpecialtyStmt = db.prepare(
  `${listDoctorsBaseQuery}
   WHERE d.specialty = ?
   ORDER BY u.full_name ASC`
);

const listSpecialtiesStmt = db.prepare(
  `SELECT DISTINCT specialty
   FROM doctors
   WHERE specialty IS NOT NULL AND trim(specialty) <> ''
   ORDER BY specialty ASC`
);

function getAllDoctors(specialty) {
  if (specialty) {
    return listDoctorsBySpecialtyStmt.all(specialty);
  }

  return listDoctorsStmt.all();
}

function getDoctorSpecialties() {
  return listSpecialtiesStmt.all().map((row) => row.specialty);
}

function createDoctor(payload) {
  const tx = db.transaction(() => {
    const passwordHash = bcrypt.hashSync(payload.password || 'Medico123*', 10);

    const userResult = db
      .prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(payload.full_name, payload.email, passwordHash, 'medico');

    db.prepare('INSERT INTO doctors (user_id, specialty, license_number, office) VALUES (?, ?, ?, ?)').run(
      userResult.lastInsertRowid,
      payload.specialty,
      payload.license_number,
      payload.office || null
    );
  });

  tx();
}

function getDoctorById(doctorId) {
  return db
    .prepare(
      `SELECT d.id, d.user_id, u.full_name, u.email, d.specialty, d.license_number, d.office
       FROM doctors d
       INNER JOIN users u ON u.id = d.user_id
       WHERE d.id = ?`
    )
    .get(doctorId);
}

function getSchedulesByDoctor(doctorId) {
  return db
    .prepare(
      'SELECT * FROM doctor_schedules WHERE doctor_id = ? AND is_active = 1 ORDER BY day_of_week, start_time'
    )
    .all(doctorId);
}

function createSchedule(doctorId, payload) {
  db.prepare(
    'INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_minutes, is_active) VALUES (?, ?, ?, ?, ?, 1)'
  ).run(doctorId, payload.day_of_week, payload.start_time, payload.end_time, payload.slot_minutes);
}

function getDoctorPanelByUserId(userId) {
  const doctor = db.prepare('SELECT id, office FROM doctors WHERE user_id = ?').get(userId);
  if (!doctor) return null;

  const appointments = db
    .prepare(
      `SELECT a.id, a.appointment_date, a.start_time, a.end_time, a.status, u.full_name as patient_name, d.office AS doctor_office
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       INNER JOIN users u ON u.id = p.user_id
       INNER JOIN doctors d ON d.id = a.doctor_id
       WHERE a.doctor_id = ?
       ORDER BY a.appointment_date DESC, a.start_time DESC`
    )
    .all(doctor.id);

  return { doctorId: doctor.id, doctorOffice: doctor.office, appointments };
}

module.exports = {
  getAllDoctors,
  getDoctorSpecialties,
  createDoctor,
  getDoctorById,
  getSchedulesByDoctor,
  createSchedule,
  getDoctorPanelByUserId
};