const { body } = require('express-validator');

const updateProfileValidator = [
  body('full_name').trim().isLength({ min: 5 }).withMessage('Nombre completo invalido.'),
  body('phone').trim().isLength({ min: 7, max: 15 }).withMessage('Telefono invalido.'),
  body('address').trim().isLength({ min: 3 }).withMessage('Direccion invalida.'),
  body('emergency_name')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 3 }).withMessage('Nombre del contacto muy corto.'),
  body('emergency_phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^9\d{8}$/).withMessage('Teléfono de emergencia debe tener 9 dígitos y comenzar con 9.'),
  body('emergency_relation')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(['Familiar', 'Amigo', 'Conyuge', 'Hijo', 'Padre', 'Otro']).withMessage('Parentesco inválido.')
];

module.exports = { updateProfileValidator };