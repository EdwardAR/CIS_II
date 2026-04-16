const { db } = require('../../config/db');

const listUsersByRoleStmt = db.prepare(
  `SELECT id, full_name
   FROM users
   WHERE role = ? AND is_active = 1
   ORDER BY full_name ASC`
);

const insertNotificationStmt = db.prepare(
  `INSERT INTO notifications (
    recipient_user_id,
    appointment_id,
    type,
    title,
    message,
    action_url,
    action_label
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`
);

const listUnreadNotificationsStmt = db.prepare(
  `SELECT id, recipient_user_id, appointment_id, type, title, message, action_url, action_label, created_at
   FROM notifications
   WHERE recipient_user_id = ? AND is_read = 0
   ORDER BY created_at DESC, id DESC
   LIMIT ?`
);

const markNotificationReadStmt = db.prepare(
  `UPDATE notifications
   SET is_read = 1, read_at = datetime('now')
   WHERE id = ? AND recipient_user_id = ?`
);

function normalizeNotification(notification) {
  const toneMap = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    danger: 'danger'
  };

  return {
    ...notification,
    tone: toneMap[notification.type] || 'info',
    badge:
      notification.type === 'danger'
        ? 'Atención'
        : notification.type === 'warning'
          ? 'Seguimiento'
          : notification.type === 'success'
            ? 'Actualización'
            : 'Notificación',
    actionLabel:
      notification.action_label ||
      (notification.type === 'warning' ? 'Revisar ahora' : notification.type === 'success' ? 'Ver detalle' : 'Abrir')
  };
}

function createNotificationForUser(recipientUserId, payload) {
  if (!recipientUserId) return null;

  insertNotificationStmt.run(
    recipientUserId,
    payload.appointmentId || null,
    payload.type || 'info',
    payload.title,
    payload.message,
    payload.actionUrl || null,
    payload.actionLabel || null
  );

  return true;
}

function createNotificationsForRole(role, payload) {
  const users = listUsersByRoleStmt.all(role);
  if (!users.length) return 0;

  const runInsertions = db.transaction(() => {
    users.forEach((user) => {
      createNotificationForUser(user.id, payload);
    });
  });

  runInsertions();
  return users.length;
}

function getUnreadNotificationsForUser(userId, limit = 4) {
  if (!userId) return [];

  return listUnreadNotificationsStmt.all(userId, limit).map(normalizeNotification);
}

function getUnreadNotificationCount(userId) {
  if (!userId) return 0;

  const row = db
    .prepare('SELECT COUNT(*) AS total FROM notifications WHERE recipient_user_id = ? AND is_read = 0')
    .get(userId);

  return row?.total || 0;
}

function markNotificationAsRead(notificationId, userId) {
  if (!notificationId || !userId) return false;

  const result = markNotificationReadStmt.run(notificationId, userId);
  return result.changes > 0;
}

module.exports = {
  createNotificationForUser,
  createNotificationsForRole,
  getUnreadNotificationsForUser,
  getUnreadNotificationCount,
  markNotificationAsRead
};