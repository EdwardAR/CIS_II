const csurf = require('csurf');

const csrfProtection = csurf();

function setCsrfToken(req, res, next) {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
  next();
}

module.exports = { csrfProtection, setCsrfToken };