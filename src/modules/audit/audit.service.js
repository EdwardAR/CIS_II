const { db } = require('../../config/db');

function log(user, actionType, targetType, targetId, description, oldValues, newValues) {
  const ip = user && user.ip ? user.ip : null;
  db.prepare(
    `INSERT INTO audit_log (user_id, user_full_name, user_role, action_type, target_type, target_id, description, old_values, new_values, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    user ? user.id : null,
    user ? user.full_name : null,
    user ? user.role : null,
    actionType,
    targetType,
    targetId || null,
    description,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null,
    ip
  );
}

function getLogs(options) {
  var where = [];
  var params = [];

  if (options.actionType) {
    where.push('action_type = ?');
    params.push(options.actionType);
  }
  if (options.targetType) {
    where.push('target_type = ?');
    params.push(options.targetType);
  }
  if (options.userId) {
    where.push('user_id = ?');
    params.push(options.userId);
  }

  var whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  var limit = Math.min(Math.max(parseInt(options.limit, 10) || 50, 1), 200);
  var offset = Math.max(parseInt(options.offset, 10) || 0, 0);

  var total = db.prepare('SELECT COUNT(*) as count FROM audit_log ' + whereClause).get(...params).count;
  var rows = db
    .prepare('SELECT * FROM audit_log ' + whereClause + ' ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(...params, limit, offset);

  return { rows, total, limit, offset };
}

module.exports = { log, getLogs };
