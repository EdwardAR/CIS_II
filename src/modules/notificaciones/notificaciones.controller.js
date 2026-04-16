const { markNotificationAsRead } = require('./notificaciones.service');

function read(req, res) {
  const notificationId = Number(req.params.id);
  markNotificationAsRead(notificationId, req.session.user.id);
  return res.redirect(req.get('referer') || '/');
}

module.exports = { read };