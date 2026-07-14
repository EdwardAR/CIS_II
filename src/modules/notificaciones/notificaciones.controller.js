const { markNotificationAsRead } = require('./notificaciones.service');
const audit = require('../audit/audit.service');

function read(req, res) {
  const notificationId = Number(req.params.id);
  markNotificationAsRead(notificationId, req.session.user.id);
  audit.log(req.session.user, 'UPDATE', 'notification', notificationId, 'Notificacion #' + notificationId + ' marcada como leida por ' + req.session.user.full_name);
  return res.redirect(req.get('referer') || '/');
}

module.exports = { read };