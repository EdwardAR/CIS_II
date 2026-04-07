const { validationResult } = require('express-validator');
const {
  listAppointmentsForRole,
  getDoctorOptions,
  getDoctorSpecialties,
  getDoctorOptionsBySpecialty,
  getAvailableSlots,
  createAppointment,
  updateAppointmentStatus
} = require('./citas.service');

function buildViewData(user, options = {}) {
  const selectedSpecialty = options.selectedSpecialty || '';
  const doctors = selectedSpecialty ? getDoctorOptionsBySpecialty(selectedSpecialty) : getDoctorOptions();

  return {
    pageTitle: 'Sistema de citas',
    appointments: listAppointmentsForRole(user),
    doctors,
    specialties: getDoctorSpecialties(),
    slots: options.slots || [],
    selectedSpecialty,
    selectedDoctorId: options.selectedDoctorId || null,
    selectedDate: options.selectedDate || null,
    formErrors: options.formErrors || []
  };
}

function index(req, res) {
  return res.render('citas/index', buildViewData(req.session.user));
}

function searchSlots(req, res) {
  const selectedSpecialty = req.query.specialty || '';
  const selectedDoctorId = Number(req.query.doctor_id);
  const selectedDate = req.query.appointment_date;

  const slots = selectedDoctorId && selectedDate ? getAvailableSlots(selectedDoctorId, selectedDate) : [];

  return res.render(
    'citas/index',
    buildViewData(req.session.user, {
      slots,
      selectedSpecialty,
      selectedDoctorId,
      selectedDate
    })
  );
}

function create(req, res) {
  const errors = validationResult(req);
  const selectedSpecialty = req.body.specialty || '';
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .render('citas/index', buildViewData(req.session.user, { selectedSpecialty, formErrors: errors.array() }));
  }

  try {
    createAppointment(req.body, req.session.user);
    req.session.flash = { type: 'success', message: 'Cita registrada con exito.' };
  } catch (error) {
    req.session.flash = { type: 'error', message: error.message };
  }

  return res.redirect('/citas');
}

function complete(req, res) {
  updateAppointmentStatus(Number(req.params.id), 'completada');
  req.session.flash = { type: 'success', message: 'Cita marcada como completada.' };
  return res.redirect('/citas');
}

function cancel(req, res) {
  updateAppointmentStatus(Number(req.params.id), 'cancelada');
  req.session.flash = { type: 'success', message: 'Cita cancelada.' };
  return res.redirect('/citas');
}

module.exports = { index, searchSlots, create, complete, cancel };