function requireRole(...roles) {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).render('layouts/error', {
        pageTitle: 'Acceso denegado',
        message: 'No cuenta con permisos para acceder a este modulo.'
      });
    }
    return next();
  };
}

module.exports = { requireRole };