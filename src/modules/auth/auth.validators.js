const { body } = require('express-validator');

const registerValidator = [
  body('full_name')
    .trim()
    .isLength({ min: 5 }).withMessage('Nombre completo debe tener al menos 5 caracteres.')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Nombre solo debe contener letras y espacios.'),

  body('email')
    .trim()
    .isEmail().withMessage('Ingrese un correo electrónico válido.')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula.')
    .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número.')
    .matches(/[!@#$%^&*(),.?":{}|<>_\-]/).withMessage('La contraseña debe contener al menos un carácter especial.'),

  body('dni')
    .trim()
    .matches(/^\d{8}$/).withMessage('DNI debe tener exactamente 8 dígitos.'),

  body('phone')
    .trim()
    .matches(/^9\d{8}$/).withMessage('Teléfono debe tener 9 dígitos y comenzar con 9.'),

  body('birth_date')
    .optional({ values: 'falsy' })
    .isDate().withMessage('Fecha de nacimiento inválida.'),

  body('address')
    .optional({ values: 'falsy' })
    .trim(),

  body('emergency_contact')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 5 }).withMessage('Contacto de emergencia muy corto.')
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Correo inválido.').normalizeEmail(),
  body('password').notEmpty().withMessage('Contraseña requerida.')
];

module.exports = { registerValidator, loginValidator };