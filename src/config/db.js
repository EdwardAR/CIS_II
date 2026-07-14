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

	CREATE TABLE IF NOT EXISTS audit_log (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		user_full_name TEXT,
		user_role TEXT,
		action_type TEXT NOT NULL,
		target_type TEXT NOT NULL,
		target_id INTEGER,
		description TEXT NOT NULL,
		old_values TEXT,
		new_values TEXT,
		ip_address TEXT,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE INDEX IF NOT EXISTS idx_audit_log_created
		ON audit_log(created_at DESC);

	CREATE INDEX IF NOT EXISTS idx_audit_log_action
		ON audit_log(action_type, target_type);
`);

module.exports = { db };