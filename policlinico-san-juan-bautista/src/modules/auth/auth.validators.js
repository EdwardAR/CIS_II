const { body } = require('express-validator');

const registerValidator = [
  body('full_name').trim().isLength({ min: 5 }).withMessage('Nombre completo invalido.'),
  body('email').trim().isEmail().withMessage('Correo invalido.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contrasena debe tener al menos 8 caracteres.'),
  body('dni').trim().isLength({ min: 8, max: 12 }).withMessage('DNI invalido.'),
  body('phone').trim().isLength({ min: 7, max: 15 }).withMessage('Telefono invalido.')
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Correo invalido.').normalizeEmail(),
  body('password').notEmpty().withMessage('Contrasena requerida.')
];

module.exports = { registerValidator, loginValidator };