const Database = require('better-sqlite3');
const { env } = require('./env');

const db = new Database(env.dbPath);
db.pragma('foreign_keys = ON');

module.exports = { db };