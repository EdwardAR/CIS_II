const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { db } = require('../config/db');

const DEFAULT_PASSWORD = 'Admin123*';

const DEFAULT_DOCTORS = [
  {
    fullName: 'Dra. Ana Torres',
    email: 'ana.torres@policlinico.pe',
    specialty: 'Medicina General',
    licenseNumber: 'CMP-00123',
    office: 'Consultorio 101',
    schedules: [
      { day: 1, start: '08:00', end: '12:00', slot: 30 },
      { day: 3, start: '08:00', end: '12:00', slot: 30 }
    ]
  },
  {
    fullName: 'Dr. Carlos Rios',
    email: 'carlos.rios@policlinico.pe',
    specialty: 'Cardiologia',
    licenseNumber: 'CMP-00456',
    office: 'Consultorio 202',
    schedules: [
      { day: 2, start: '09:00', end: '13:00', slot: 30 },
      { day: 4, start: '09:00', end: '13:00', slot: 30 }
    ]
  },
  {
    fullName: 'Dra. Lucia Herrera',
    email: 'lucia.herrera@policlinico.pe',
    specialty: 'Pediatria',
    licenseNumber: 'CMP-00789',
    office: 'Consultorio 103',
    schedules: [
      { day: 1, start: '14:00', end: '18:00', slot: 20 },
      { day: 5, start: '08:00', end: '12:00', slot: 20 }
    ]
  },
  {
    fullName: 'Dr. Mateo Salazar',
    email: 'mateo.salazar@policlinico.pe',
    specialty: 'Dermatologia',
    licenseNumber: 'CMP-01011',
    office: 'Consultorio 204',
    schedules: [{ day: 4, start: '14:00', end: '18:00', slot: 30 }]
  },
  {
    fullName: 'Dra. Valeria Nunez',
    email: 'valeria.nunez@policlinico.pe',
    specialty: 'Neurologia',
    licenseNumber: 'CMP-01312',
    office: 'Consultorio 305',
    schedules: [
      { day: 2, start: '14:00', end: '18:00', slot: 30 },
      { day: 5, start: '14:00', end: '17:00', slot: 30 }
    ]
  },
  {
    fullName: 'Dr. Diego Paredes',
    email: 'diego.paredes@policlinico.pe',
    specialty: 'Traumatologia',
    licenseNumber: 'CMP-01555',
    office: 'Consultorio 206',
    schedules: [
      { day: 1, start: '09:00', end: '13:00', slot: 30 },
      { day: 3, start: '15:00', end: '19:00', slot: 30 }
    ]
  },
  {
    fullName: 'Dra. Sofia Campos',
    email: 'sofia.campos@policlinico.pe',
    specialty: 'Ginecologia',
    licenseNumber: 'CMP-01777',
    office: 'Consultorio 108',
    schedules: [
      { day: 2, start: '08:00', end: '12:00', slot: 30 },
      { day: 4, start: '08:00', end: '12:00', slot: 30 }
    ]
  },
  {
    fullName: 'Dr. Renato Flores',
    email: 'renato.flores@policlinico.pe',
    specialty: 'Endocrinologia',
    licenseNumber: 'CMP-01901',
    office: 'Consultorio 309',
    schedules: [
      { day: 1, start: '14:00', end: '18:00', slot: 30 },
      { day: 4, start: '08:00', end: '12:00', slot: 30 }
    ]
  },
  {
    fullName: 'Dra. Patricia Leon',
    email: 'patricia.leon@policlinico.pe',
    specialty: 'Otorrinolaringologia',
    licenseNumber: 'CMP-02015',
    office: 'Consultorio 110',
    schedules: [
      { day: 2, start: '10:00', end: '14:00', slot: 30 },
      { day: 5, start: '08:00', end: '12:00', slot: 30 }
    ]
  },
  {
    fullName: 'Dr. Javier Molina',
    email: 'javier.molina@policlinico.pe',
    specialty: 'Urologia',
    licenseNumber: 'CMP-02160',
    office: 'Consultorio 312',
    schedules: [
      { day: 3, start: '09:00', end: '13:00', slot: 30 },
      { day: 5, start: '14:00', end: '18:00', slot: 30 }
    ]
  },
  {
    fullName: 'Dra. Elisa Romero',
    email: 'elisa.romero@policlinico.pe',
    specialty: 'Oftalmologia',
    licenseNumber: 'CMP-02234',
    office: 'Consultorio 207',
    schedules: [
      { day: 1, start: '08:30', end: '12:30', slot: 30 },
      { day: 4, start: '14:00', end: '18:00', slot: 30 }
    ]
  }
];

const DEFAULT_PATIENTS = [
  {
    fullName: 'Maria Perez',
    email: 'maria.perez@pacientes.pe',
    dni: '73829145',
    phone: '987654321',
    birthDate: '1992-04-15',
    address: 'Av. Los Rosales 123',
    emergencyContact: 'Juan Perez - 999111222'
  },
  {
    fullName: 'Jose Quispe',
    email: 'jose.quispe@pacientes.pe',
    dni: '70654321',
    phone: '912345678',
    birthDate: '1988-09-01',
    address: 'Jr. Los Olivos 580',
    emergencyContact: 'Elena Quispe - 988777666'
  },
  {
    fullName: 'Carla Mendoza',
    email: 'carla.mendoza@pacientes.pe',
    dni: '75432109',
    phone: '981223344',
    birthDate: '1995-11-20',
    address: 'Av. Primavera 420',
    emergencyContact: 'Ramon Mendoza - 955443322'
  },
  {
    fullName: 'Luis Alvarado',
    email: 'luis.alvarado@pacientes.pe',
    dni: '71998877',
    phone: '964112233',
    birthDate: '1983-02-08',
    address: 'Calle Las Flores 188',
    emergencyContact: 'Mariela Alvarado - 977001122'
  },
  {
    fullName: 'Rosa Huaman',
    email: 'rosa.huaman@pacientes.pe',
    dni: '74556688',
    phone: '973332211',
    birthDate: '1979-07-03',
    address: 'Jr. San Martin 950',
    emergencyContact: 'Pedro Huaman - 966778899'
  },
  {
    fullName: 'Andrea Salinas',
    email: 'andrea.salinas@pacientes.pe',
    dni: '75112233',
    phone: '989001122',
    birthDate: '1998-05-27',
    address: 'Av. El Sol 330',
    emergencyContact: 'Miguel Salinas - 978881144'
  },
  {
    fullName: 'Pedro Caceres',
    email: 'pedro.caceres@pacientes.pe',
    dni: '71234590',
    phone: '982776655',
    birthDate: '1986-10-10',
    address: 'Jr. Lima 541',
    emergencyContact: 'Ruth Caceres - 981998877'
  },
  {
    fullName: 'Daniela Rojas',
    email: 'daniela.rojas@pacientes.pe',
    dni: '76789012',
    phone: '985667788',
    birthDate: '1993-01-19',
    address: 'Calle Central 88',
    emergencyContact: 'Luis Rojas - 977554433'
  },
  {
    fullName: 'Ricardo Vega',
    email: 'ricardo.vega@pacientes.pe',
    dni: '70011223',
    phone: '984443322',
    birthDate: '1975-12-02',
    address: 'Av. Progreso 761',
    emergencyContact: 'Diana Vega - 971220033'
  },
  {
    fullName: 'Luciana Soto',
    email: 'luciana.soto@pacientes.pe',
    dni: '77889900',
    phone: '981110022',
    birthDate: '2000-03-30',
    address: 'Jr. Los Claveles 452',
    emergencyContact: 'Rosa Soto - 972334455'
  },
  {
    fullName: 'Fernando Aquino',
    email: 'fernando.aquino@pacientes.pe',
    dni: '73445566',
    phone: '986220044',
    birthDate: '1981-06-14',
    address: 'Urb. Santa Ana Mz B Lt 9',
    emergencyContact: 'Silvia Aquino - 973660077'
  }
];

const DEFAULT_APPOINTMENTS = [
  {
    patientEmail: 'maria.perez@pacientes.pe',
    doctorEmail: 'ana.torres@policlinico.pe',
    date: '2026-04-08',
    start: '08:00',
    end: '08:30',
    status: 'pendiente',
    reason: 'Control general anual',
    notes: 'Paciente con chequeo preventivo'
  },
  {
    patientEmail: 'jose.quispe@pacientes.pe',
    doctorEmail: 'carlos.rios@policlinico.pe',
    date: '2026-04-09',
    start: '09:00',
    end: '09:30',
    status: 'completada',
    reason: 'Control de presion arterial',
    notes: 'Recomendada evaluacion en 3 meses'
  },
  {
    patientEmail: 'carla.mendoza@pacientes.pe',
    doctorEmail: 'sofia.campos@policlinico.pe',
    date: '2026-04-10',
    start: '08:30',
    end: '09:00',
    status: 'pendiente',
    reason: 'Chequeo ginecologico preventivo',
    notes: 'Primera visita en el policlinico'
  },
  {
    patientEmail: 'luis.alvarado@pacientes.pe',
    doctorEmail: 'diego.paredes@policlinico.pe',
    date: '2026-04-11',
    start: '09:30',
    end: '10:00',
    status: 'cancelada',
    reason: 'Dolor de rodilla por actividad fisica',
    notes: 'Cancelada por inasistencia del paciente'
  },
  {
    patientEmail: 'rosa.huaman@pacientes.pe',
    doctorEmail: 'valeria.nunez@policlinico.pe',
    date: '2026-04-12',
    start: '14:00',
    end: '14:30',
    status: 'pendiente',
    reason: 'Dolor de cabeza recurrente',
    notes: 'Solicita evaluacion neurologica'
  },
  {
    patientEmail: 'andrea.salinas@pacientes.pe',
    doctorEmail: 'renato.flores@policlinico.pe',
    date: '2026-04-13',
    start: '14:00',
    end: '14:30',
    status: 'pendiente',
    reason: 'Control de tiroides',
    notes: 'Paciente con seguimiento de laboratorio'
  },
  {
    patientEmail: 'pedro.caceres@pacientes.pe',
    doctorEmail: 'patricia.leon@policlinico.pe',
    date: '2026-04-14',
    start: '10:00',
    end: '10:30',
    status: 'completada',
    reason: 'Congestion nasal persistente',
    notes: 'Se indica tratamiento por 7 dias'
  },
  {
    patientEmail: 'daniela.rojas@pacientes.pe',
    doctorEmail: 'elisa.romero@policlinico.pe',
    date: '2026-04-15',
    start: '08:30',
    end: '09:00',
    status: 'pendiente',
    reason: 'Evaluacion de agudeza visual',
    notes: 'Primera consulta oftalmologica'
  },
  {
    patientEmail: 'ricardo.vega@pacientes.pe',
    doctorEmail: 'javier.molina@policlinico.pe',
    date: '2026-04-16',
    start: '09:00',
    end: '09:30',
    status: 'cancelada',
    reason: 'Dolor lumbar y malestar urinario',
    notes: 'Paciente solicito reprogramacion'
  },
  {
    patientEmail: 'luciana.soto@pacientes.pe',
    doctorEmail: 'lucia.herrera@policlinico.pe',
    date: '2026-04-17',
    start: '08:00',
    end: '08:20',
    status: 'pendiente',
    reason: 'Control de crecimiento',
    notes: 'Consulta preventiva'
  },
  {
    patientEmail: 'fernando.aquino@pacientes.pe',
    doctorEmail: 'diego.paredes@policlinico.pe',
    date: '2026-04-18',
    start: '09:00',
    end: '09:30',
    status: 'completada',
    reason: 'Dolor en hombro derecho',
    notes: 'Se indica terapia fisica'
  }
];

function ensureUser(insertUserStmt, fullName, email, passwordHash, role) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return existing.id;
  return insertUserStmt.run(fullName, email, passwordHash, role).lastInsertRowid;
}

function ensureDoctor(doctorUserId, doctorData) {
  const existing = db.prepare('SELECT id FROM doctors WHERE license_number = ?').get(doctorData.licenseNumber);
  if (existing) return existing.id;

  return db
    .prepare('INSERT INTO doctors (user_id, specialty, license_number, office) VALUES (?, ?, ?, ?)')
    .run(doctorUserId, doctorData.specialty, doctorData.licenseNumber, doctorData.office).lastInsertRowid;
}

function ensureSchedule(doctorId, schedule) {
  const existing = db
    .prepare(
      `SELECT id
       FROM doctor_schedules
       WHERE doctor_id = ? AND day_of_week = ? AND start_time = ? AND end_time = ? AND is_active = 1`
    )
    .get(doctorId, schedule.day, schedule.start, schedule.end);

  if (existing) return;

  db.prepare(
    'INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_minutes, is_active) VALUES (?, ?, ?, ?, ?, 1)'
  ).run(doctorId, schedule.day, schedule.start, schedule.end, schedule.slot);
}

function ensurePatient(patientUserId, patientData) {
  const existing = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(patientUserId);
  if (existing) return existing.id;

  return db
    .prepare(
      `INSERT INTO patients (user_id, dni, phone, birth_date, address, emergency_contact)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      patientUserId,
      patientData.dni,
      patientData.phone,
      patientData.birthDate,
      patientData.address,
      patientData.emergencyContact
    ).lastInsertRowid;
}

function ensureAppointment(appointment, adminUserId) {
  const patient = db
    .prepare(
      `SELECT p.id
       FROM patients p
       INNER JOIN users u ON u.id = p.user_id
       WHERE u.email = ?`
    )
    .get(appointment.patientEmail);

  const doctor = db
    .prepare(
      `SELECT d.id
       FROM doctors d
       INNER JOIN users u ON u.id = d.user_id
       WHERE u.email = ?`
    )
    .get(appointment.doctorEmail);

  if (!patient || !doctor) return;

  const existing = db
    .prepare('SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND start_time = ?')
    .get(doctor.id, appointment.date, appointment.start);

  if (existing) return;

  db.prepare(
    `INSERT INTO appointments (
      patient_id,
      doctor_id,
      appointment_date,
      start_time,
      end_time,
      status,
      reason,
      notes,
      created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    patient.id,
    doctor.id,
    appointment.date,
    appointment.start,
    appointment.end,
    appointment.status,
    appointment.reason,
    appointment.notes,
    adminUserId
  );
}

function ensureAppointmentsStatusSchema() {
  const tableInfo = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'appointments'")
    .get();

  if (!tableInfo || !tableInfo.sql || tableInfo.sql.includes("'solicitud_reprogramacion'")) {
    return;
  }

  const migrate = db.transaction(() => {
    db.exec(`
      ALTER TABLE appointments RENAME TO appointments_old;

      CREATE TABLE appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        appointment_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente', 'completada', 'cancelada', 'reprogramada', 'solicitud_reprogramacion')),
        reason TEXT,
        notes TEXT,
        created_by_user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(patient_id) REFERENCES patients(id),
        FOREIGN KEY(doctor_id) REFERENCES doctors(id),
        FOREIGN KEY(created_by_user_id) REFERENCES users(id),
        UNIQUE(doctor_id, appointment_date, start_time)
      );

      INSERT INTO appointments (
        id,
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        status,
        reason,
        notes,
        created_by_user_id,
        created_at
      )
      SELECT
        id,
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        CASE
          WHEN status IN ('pendiente', 'completada', 'cancelada', 'reprogramada', 'solicitud_reprogramacion') THEN status
          ELSE 'pendiente'
        END,
        reason,
        notes,
        created_by_user_id,
        created_at
      FROM appointments_old;

      DROP TABLE appointments_old;
    `);
  });

  migrate();
}

function initDatabase() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  ensureAppointmentsStatusSchema();

  const defaultPasswordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

  const seedDefaults = db.transaction(() => {
    const insertUser = db.prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)');

    const adminId = ensureUser(
      insertUser,
      'Administrador General',
      'admin@policlinico.pe',
      defaultPasswordHash,
      'admin'
    );

    DEFAULT_DOCTORS.forEach((doctor) => {
      const doctorUserId = ensureUser(insertUser, doctor.fullName, doctor.email, defaultPasswordHash, 'medico');
      const doctorId = ensureDoctor(doctorUserId, doctor);
      doctor.schedules.forEach((schedule) => ensureSchedule(doctorId, schedule));
    });

    DEFAULT_PATIENTS.forEach((patient) => {
      const patientUserId = ensureUser(insertUser, patient.fullName, patient.email, defaultPasswordHash, 'paciente');
      ensurePatient(patientUserId, patient);
    });

    DEFAULT_APPOINTMENTS.forEach((appointment) => ensureAppointment(appointment, adminId));

    return adminId;
  });

  const adminId = seedDefaults();

  console.log('Base de datos inicializada y datos de referencia cargados.');
  console.log('Admin: admin@policlinico.pe / Admin123*');
  console.log('Medicos y pacientes demo usan la contrasena: Admin123*');
  console.log(`Admin ID: ${adminId}`);
}

module.exports = { initDatabase };

if (require.main === module) {
  initDatabase();
}