function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  return next();
}

function requireGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect('/');
  }
  return next();
}

module.exports = { requireAuth, requireGuest };