const { validationResult } = require('express-validator');
const { getPatientProfileByUserId, updatePatientProfile, getDoctorAvailabilitySnapshot } = require('./pacientes.service');

function buildAvailabilitySummary(doctorsAvailability) {
  const inShift = doctorsAvailability.filter((doctor) => doctor.is_in_shift).length;
  return {
    total: doctorsAvailability.length,
    inShift,
    outOfShift: doctorsAvailability.length - inShift
  };
}

function profile(req, res) {
  const patient = getPatientProfileByUserId(req.session.user.id);
  const doctorsAvailability = getDoctorAvailabilitySnapshot();
  return res.render('pacientes/profile', {
    pageTitle: 'Mi perfil',
    patient,
    doctorsAvailability,
    availabilitySummary: buildAvailabilitySummary(doctorsAvailability)
  });
}

function updateProfile(req, res) {
  const errors = validationResult(req);
  const patient = getPatientProfileByUserId(req.session.user.id);
  const doctorsAvailability = getDoctorAvailabilitySnapshot();

  if (!errors.isEmpty()) {
    return res.status(400).render('pacientes/profile', {
      pageTitle: 'Mi perfil',
      patient,
      doctorsAvailability,
      availabilitySummary: buildAvailabilitySummary(doctorsAvailability),
      formErrors: errors.array()
    });
  }

  updatePatientProfile(req.session.user.id, req.body);
  req.session.user.full_name = req.body.full_name;
  req.session.flash = { type: 'success', message: 'Perfil actualizado correctamente.' };
  return res.redirect('/pacientes/perfil');
}

module.exports = { profile, updateProfile };