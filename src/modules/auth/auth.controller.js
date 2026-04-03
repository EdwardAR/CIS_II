const { validationResult } = require('express-validator');
const { findUserByEmail, createPatientUser, validatePassword } = require('./auth.service');

function showLogin(req, res) {
  return res.render('auth/login', { pageTitle: 'Iniciar sesion' });
}

function showRegister(req, res) {
  return res.render('auth/register', { pageTitle: 'Registro de paciente' });
}

function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('auth/register', {
      pageTitle: 'Registro de paciente',
      formErrors: errors.array()
    });
  }

  const existing = findUserByEmail(req.body.email);
  if (existing) {
    return res.status(409).render('auth/register', {
      pageTitle: 'Registro de paciente',
      formErrors: [{ msg: 'El correo ya se encuentra registrado.' }]
    });
  }

  try {
    createPatientUser(req.body);
    req.session.flash = { type: 'success', message: 'Registro exitoso. Ya puede iniciar sesion.' };
    return res.redirect('/auth/login');
  } catch (error) {
    return res.status(500).render('auth/register', {
      pageTitle: 'Registro de paciente',
      formErrors: [{ msg: 'No se pudo registrar el usuario.' }]
    });
  }
}

function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('auth/login', {
      pageTitle: 'Iniciar sesion',
      formErrors: errors.array()
    });
  }

  const user = findUserByEmail(req.body.email);
  if (!user || !validatePassword(req.body.password, user.password_hash)) {
    return res.status(401).render('auth/login', {
      pageTitle: 'Iniciar sesion',
      formErrors: [{ msg: 'Credenciales invalidas.' }]
    });
  }

  req.session.user = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role
  };

  return res.redirect('/');
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
}

module.exports = { showLogin, showRegister, register, login, logout };