const { body } = require('express-validator');

const createAppointmentValidator = [
  body('doctor_id').isInt({ min: 1 }).withMessage('Medico invalido.'),
  body('appointment_date').isDate().withMessage('Fecha invalida.'),
  body('start_time').matches(/^\d{2}:\d{2}$/).withMessage('Hora invalida.'),
  body('reason').trim().isLength({ min: 5 }).withMessage('Motivo demasiado corto.')
];

const editAppointmentStatusValidator = [
  body('status')
    .isIn(['pendiente', 'completada', 'cancelada', 'reprogramada', 'solicitud_reprogramacion'])
    .withMessage('Estado de cita invalido.')
];

module.exports = { createAppointmentValidator, editAppointmentStatusValidator };