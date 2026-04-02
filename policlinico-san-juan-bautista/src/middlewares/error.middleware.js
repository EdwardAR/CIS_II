const { logError } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logError(err);
  if (res.headersSent) return next(err);
  return res.status(500).render('layouts/error', {
    pageTitle: 'Error interno',
    message: 'Ocurrio un error interno. Intente nuevamente.'
  });
}

module.exports = { errorHandler };