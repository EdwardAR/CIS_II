INSERT OR IGNORE INTO users (id, full_name, email, password_hash, role) VALUES
(1, 'Administrador General', 'admin@policlinico.pe', '$2b$10$q7e56S6YxC7xYwB9n8R7WepjFiB0aRj7F6B9Jlz9qeIibLiX6M7rm', 'admin'),
(2, 'Dra. Ana Torres', 'ana.torres@policlinico.pe', '$2b$10$q7e56S6YxC7xYwB9n8R7WepjFiB0aRj7F6B9Jlz9qeIibLiX6M7rm', 'medico');

INSERT OR IGNORE INTO doctors (id, user_id, specialty, license_number, office) VALUES
(1, 2, 'Medicina General', 'CMP-00123', 'Consultorio 101');

INSERT OR IGNORE INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_minutes, is_active) VALUES
(1, 1, '08:00', '12:00', 30, 1),
(1, 3, '08:00', '12:00', 30, 1),
(1, 5, '14:00', '18:00', 30, 1);