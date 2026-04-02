const { validationResult } = require('express-validator');
const { getPatientProfileByUserId, updatePatientProfile } = require('./pacientes.service');

function profile(req, res) {
  const patient = getPatientProfileByUserId(req.session.user.id);
  return res.render('pacientes/profile', {
    pageTitle: 'Mi perfil',
    patient
  });
}

function updateProfile(req, res) {
  const errors = validationResult(req);
  const patient = getPatientProfileByUserId(req.session.user.id);

  if (!errors.isEmpty()) {
    return res.status(400).render('pacientes/profile', {
      pageTitle: 'Mi perfil',
      patient,
      formErrors: errors.array()
    });
  }

  updatePatientProfile(req.session.user.id, req.body);
  req.session.user.full_name = req.body.full_name;
  req.session.flash = { type: 'success', message: 'Perfil actualizado correctamente.' };
  return res.redirect('/pacientes/perfil');
}

module.exports = { profile, updateProfile };