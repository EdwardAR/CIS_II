const { validationResult } = require('express-validator');
const {
  listAppointmentsForRole,
  getDoctorOptions,
  getAvailableSlots,
  createAppointment,
  updateAppointmentStatus
} = require('./citas.service');

function index(req, res) {
  const appointments = listAppointmentsForRole(req.session.user);
  const doctors = getDoctorOptions();
  return res.render('citas/index', {
    pageTitle: 'Sistema de citas',
    appointments,
    doctors,
    slots: [],
    selectedDoctorId: null,
    selectedDate: null
  });
}

function searchSlots(req, res) {
  const appointments = listAppointmentsForRole(req.session.user);
  const doctors = getDoctorOptions();
  const selectedDoctorId = Number(req.query.doctor_id);
  const selectedDate = req.query.appointment_date;

  const slots = selectedDoctorId && selectedDate ? getAvailableSlots(selectedDoctorId, selectedDate) : [];

  return res.render('citas/index', {
    pageTitle: 'Sistema de citas',
    appointments,
    doctors,
    slots,
    selectedDoctorId,
    selectedDate
  });
}

function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const appointments = listAppointmentsForRole(req.session.user);
    const doctors = getDoctorOptions();
    return res.status(400).render('citas/index', {
      pageTitle: 'Sistema de citas',
      appointments,
      doctors,
      slots: [],
      selectedDoctorId: null,
      selectedDate: null,
      formErrors: errors.array()
    });
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