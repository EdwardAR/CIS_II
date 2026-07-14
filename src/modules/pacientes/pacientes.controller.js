const { validationResult } = require('express-validator');
const { getPatientProfileByUserId, updatePatientProfile, getDoctorAvailabilitySnapshot } = require('./pacientes.service');
const audit = require('../audit/audit.service');

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

  var oldPatient = getPatientProfileByUserId(req.session.user.id);
  updatePatientProfile(req.session.user.id, req.body);
  req.session.user.full_name = req.body.full_name;
  audit.log(req.session.user, 'UPDATE', 'patient', req.session.user.id, 'Perfil de paciente actualizado', { full_name: oldPatient.full_name, phone: oldPatient.phone, address: oldPatient.address }, { full_name: req.body.full_name, phone: req.body.phone, address: req.body.address });
  req.session.flash = { type: 'success', message: 'Perfil actualizado correctamente.' };
  return res.redirect('/pacientes/perfil');
}

module.exports = { profile, updateProfile };