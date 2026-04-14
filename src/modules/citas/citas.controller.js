const { validationResult } = require('express-validator');
const {
  listAppointmentsForRole,
  getDoctorOptions,
  getDoctorSpecialties,
  getDoctorOptionsBySpecialty,
  getDoctorById,
  getDoctorSchedule,
  getAvailableSlots,
  createAppointment,
  updateAppointmentStatus
} = require('./citas.service');

function buildViewData(user, options = {}) {
  const selectedSpecialty = options.selectedSpecialty || '';
  const doctors = selectedSpecialty ? getDoctorOptionsBySpecialty(selectedSpecialty) : getDoctorOptions();
  const appointments = listAppointmentsForRole(user);
  const selectedDoctorId = Number(options.selectedDoctorId) || null;
  const selectedDoctor = selectedDoctorId ? getDoctorById(selectedDoctorId) : null;
  const selectedDoctorSchedule = selectedDoctorId ? getDoctorSchedule(selectedDoctorId) : [];

  const selectedDate = options.selectedDate || null;
  const selectedDayOfWeek = selectedDate ? new Date(`${selectedDate}T00:00:00`).getDay() : null;
  const selectedDateHasShift =
    selectedDayOfWeek === null
      ? null
      : selectedDoctorSchedule.some((slot) => slot.day_of_week === selectedDayOfWeek);

  return {
    pageTitle: 'Sistema de citas',
    appointments,
    appointmentSummary: buildAppointmentSummary(appointments),
    doctors,
    specialties: getDoctorSpecialties(),
    slots: options.slots || [],
    selectedSpecialty,
    selectedDoctorId,
    selectedDoctor,
    selectedDoctorSchedule,
    selectedDate,
    selectedDayOfWeek,
    selectedDateHasShift,
    formErrors: options.formErrors || []
  };
}

function buildAppointmentSummary(appointments) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayIso = `${year}-${month}-${day}`;

  const pending = appointments.filter((item) => item.status === 'pendiente').length;
  const completed = appointments.filter((item) => item.status === 'completada').length;
  const cancelled = appointments.filter((item) => item.status === 'cancelada').length;
  const todayCount = appointments.filter((item) => item.appointment_date === todayIso).length;
  const upcomingCount = appointments.filter((item) => item.appointment_date >= todayIso).length;

  return {
    total: appointments.length,
    pending,
    completed,
    cancelled,
    today: todayCount,
    upcoming: upcomingCount
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