CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('paciente', 'medico', 'admin')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  dni TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  birth_date TEXT,
  address TEXT,
  emergency_contact TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  specialty TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  office TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS doctor_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  slot_minutes INTEGER NOT NULL DEFAULT 30,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
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

CREATE TABLE IF NOT EXISTS appointment_reschedule_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_appointment_id INTEGER NOT NULL,
  new_appointment_id INTEGER,
  requested_by_user_id INTEGER NOT NULL,
  approved_by_user_id INTEGER NOT NULL,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(original_appointment_id) REFERENCES appointments(id),
  FOREIGN KEY(new_appointment_id) REFERENCES appointments(id),
  FOREIGN KEY(requested_by_user_id) REFERENCES users(id),
  FOREIGN KEY(approved_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_user_id INTEGER NOT NULL,
  appointment_id INTEGER,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read
  ON notifications(recipient_user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS appointment_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id INTEGER NOT NULL UNIQUE,
  patient_user_id INTEGER NOT NULL,
  doctor_user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY(patient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(doctor_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_appointment_ratings_doctor
  ON appointment_ratings(doctor_user_id, created_at DESC);