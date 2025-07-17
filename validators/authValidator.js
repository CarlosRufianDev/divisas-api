const { body } = require('express-validator');

const registerValidator = [
  body('email')
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('La contraseña debe tener al menos una mayúscula')
    .matches(/[a-z]/).withMessage('La contraseña debe tener al menos una minúscula')
    .matches(/[0-9]/).withMessage('La contraseña debe tener al menos un número')
    .trim()
];

const loginValidator = [
  body('email')
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .trim()
];

module.exports = { registerValidator, loginValidator };