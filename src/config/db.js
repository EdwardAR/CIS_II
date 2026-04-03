const Database = require('better-sqlite3');
const { env } = require('./env');

const db = new Database(env.dbPath);

db.pragma('foreign_keys = ON');
// WAL mejora concurrencia lectura/escritura en SQLite para apps web.
db.pragma('journal_mode = WAL');
// NORMAL reduce fsync cost manteniendo buena seguridad para un entorno local.
db.pragma('synchronous = NORMAL');

db.pragma('busy_timeout = 5000');

module.exports = { db };