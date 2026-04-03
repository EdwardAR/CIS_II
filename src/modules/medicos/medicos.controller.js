const { validationResult } = require('express-validator');
const {
  getAllDoctors,
  createDoctor,
  getDoctorById,
  getSchedulesByDoctor,
  createSchedule,
  getDoctorPanelByUserId
} = require('./medicos.service');

function index(req, res) {
  const doctors = getAllDoctors();
  return res.render('medicos/index', {
    pageTitle: 'Gestion de medicos',
    doctors
  });
}

function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const doctors = getAllDoctors();
    return res.status(400).render('medicos/index', {
      pageTitle: 'Gestion de medicos',
      doctors,
      formErrors: errors.array()
    });
  }

  createDoctor(req.body);
  req.session.flash = { type: 'success', message: 'Medico registrado correctamente.' };
  return res.redirect('/medicos');
}

function schedules(req, res) {
  const doctor = getDoctorById(Number(req.params.doctorId));
  const schedulesList = getSchedulesByDoctor(Number(req.params.doctorId));
  return res.render('medicos/schedules', {
    pageTitle: 'Horarios del medico',
    doctor,
    schedules: schedulesList
  });
}

function addSchedule(req, res) {
  const doctorId = Number(req.params.doctorId);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const doctor = getDoctorById(doctorId);
    const schedulesList = getSchedulesByDoctor(doctorId);
    return res.status(400).render('medicos/schedules', {
      pageTitle: 'Horarios del medico',
      doctor,
      schedules: schedulesList,
      formErrors: errors.array()
    });
  }

  createSchedule(doctorId, req.body);
  req.session.flash = { type: 'success', message: 'Horario agregado correctamente.' };
  return res.redirect(`/medicos/${doctorId}/horarios`);
}

function doctorPanel(req, res) {
  const panel = getDoctorPanelByUserId(req.session.user.id);
  return res.render('medicos/doctor-panel', {
    pageTitle: 'Panel del medico',
    panel
  });
}

module.exports = { index, create, schedules, addSchedule, doctorPanel };