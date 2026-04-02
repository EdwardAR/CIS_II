const { body } = require('express-validator');

const updateProfileValidator = [
  body('full_name').trim().isLength({ min: 5 }).withMessage('Nombre completo invalido.'),
  body('phone').trim().isLength({ min: 7, max: 15 }).withMessage('Telefono invalido.'),
  body('address').trim().isLength({ min: 3 }).withMessage('Direccion invalida.')
];

module.exports = { updateProfileValidator };