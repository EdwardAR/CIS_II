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
  updateAppointmentStatus,
  requestAppointmentReschedule,
  approveAppointmentReschedule,
  isAutoRescheduledAppointment
} = require('./citas.service');
const { formatIsoDateToDmy } = require('../../utils/date');

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

  const appointmentsWithFlags = appointments.map((appointment) => ({
    ...appointment,
    is_auto_rescheduled: isAutoRescheduledAppointment(appointment.id)
  }));

  return {
    pageTitle: 'Sistema de citas',
    appointments: appointmentsWithFlags,
    appointmentSummary: buildAppointmentSummary(appointmentsWithFlags),
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
  const reprogrammed = appointments.filter((item) => item.status === 'reprogramada').length;
  const rescheduleRequested = appointments.filter((item) => item.status === 'solicitud_reprogramacion').length;
  const todayCount = appointments.filter((item) => item.appointment_date === todayIso).length;
  const upcomingCount = appointments.filter((item) => item.appointment_date >= todayIso).length;

  return {
    total: appointments.length,
    pending,
    completed,
    cancelled,
    reprogrammed,
    rescheduleRequested,
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

function editStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.flash = { type: 'error', message: errors.array()[0].msg };
    return res.redirect('/citas');
  }

  const appointmentId = Number(req.params.id);
  const status = req.body.status;

  try {
    updateAppointmentStatus(appointmentId, status);
    req.session.flash = { type: 'success', message: `Cita actualizada a estado ${status}.` };
  } catch (error) {
    req.session.flash = { type: 'error', message: error.message };
  }

  return res.redirect('/citas');
}

function requestReschedule(req, res) {
  const appointmentId = Number(req.params.id);

  try {
    requestAppointmentReschedule(appointmentId, req.session.user);
    req.session.flash = {
      type: 'success',
      message: 'Solicitud de reprogramacion enviada. Un medico o administrador debe aprobarla.'
    };
  } catch (error) {
    req.session.flash = { type: 'error', message: error.message };
  }

  return res.redirect('/citas');
}

function approveReschedule(req, res) {
  const appointmentId = Number(req.params.id);

  try {
    const result = approveAppointmentReschedule(appointmentId, req.session.user);
    req.session.flash = {
      type: 'success',
      message: `Reprogramacion aprobada. Nueva cita #${result.newAppointmentId} agendada para ${formatIsoDateToDmy(result.appointmentDate)} ${result.startTime}.`
    };
  } catch (error) {
    req.session.flash = { type: 'error', message: error.message };
  }

  return res.redirect('/citas');
}

module.exports = { index, searchSlots, create, complete, cancel, editStatus, requestReschedule, approveReschedule };