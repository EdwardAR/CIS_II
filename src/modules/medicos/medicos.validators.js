const { body } = require('express-validator');

const doctorValidator = [
  body('full_name').trim().isLength({ min: 5 }).withMessage('Nombre del medico invalido.'),
  body('email').trim().isEmail().withMessage('Correo invalido.').normalizeEmail(),
  body('specialty').trim().isLength({ min: 3 }).withMessage('Especialidad invalida.'),
  body('license_number').trim().isLength({ min: 5 }).withMessage('CMP invalido.')
];

const scheduleValidator = [
  body('day_of_week').isInt({ min: 0, max: 6 }).withMessage('Dia de semana invalido.'),
  body('start_time').matches(/^\d{2}:\d{2}$/).withMessage('Hora de inicio invalida.'),
  body('end_time').matches(/^\d{2}:\d{2}$/).withMessage('Hora de fin invalida.'),
  body('slot_minutes').isInt({ min: 10, max: 120 }).withMessage('Duracion de bloque invalida.')
];

module.exports = { doctorValidator, scheduleValidator };