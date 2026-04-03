const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');
const { sessionMiddleware } = require('./config/session');
const { csrfProtection } = require('./middlewares/csrf.middleware');
const { errorHandler } = require('./middlewares/error.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const pacientesRoutes = require('./modules/pacientes/pacientes.routes');
const medicosRoutes = require('./modules/medicos/medicos.routes');
const citasRoutes = require('./modules/citas/citas.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(sessionMiddleware);

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: 'Demasiados intentos. Intente mas tarde.',
  // Limita solo intentos de login para no bloquear pantallas de auth.
  skip: (req) => !(req.method === 'POST' && req.path === '/login')
});

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.formErrors = [];
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/auth', authLimiter, authRoutes);
app.use('/pacientes', pacientesRoutes);
app.use('/medicos', medicosRoutes);
app.use('/citas', citasRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  if (req.session.user.role === 'admin') return res.redirect('/admin');
  if (req.session.user.role === 'medico') return res.redirect('/medicos/mi-panel');
  return res.redirect('/citas');
});

app.use((req, res) => {
  res.status(404).render('layouts/error', {
    pageTitle: 'No encontrado',
    message: 'La pagina solicitada no existe.'
  });
});

app.use((err, req, res, next) => {
  if (err && err.code === 'EBADCSRFTOKEN') {
    req.session.flash = { type: 'error', message: 'Sesion invalida. Recargue la pagina.' };
    return res.redirect('back');
  }
  return errorHandler(err, req, res, next);
});

module.exports = app;