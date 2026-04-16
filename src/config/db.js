const Database = require('better-sqlite3');
const { env } = require('./env');

const db = new Database(env.dbPath);

db.pragma('foreign_keys = ON');
// WAL mejora concurrencia lectura/escritura en SQLite para apps web.
db.pragma('journal_mode = WAL');
// NORMAL reduce fsync cost manteniendo buena seguridad para un entorno local.
db.pragma('synchronous = NORMAL');

db.pragma('busy_timeout = 5000');

db.exec(`
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
`);

module.exports = { db };