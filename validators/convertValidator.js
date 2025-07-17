const { body } = require('express-validator');

const validateConversion = [
  body('from')
    .isString().withMessage('La moneda origen debe ser un texto')
    .isLength({ min: 3, max: 3 }).withMessage('El código de moneda origen debe tener 3 letras')
    .trim().toUpperCase(),
  body('to')
    .isString().withMessage('La moneda destino debe ser un texto')
    .isLength({ min: 3, max: 3 }).withMessage('El código de moneda destino debe tener 3 letras')
    .trim().toUpperCase(),
  body('amount')
    .isNumeric().withMessage('La cantidad debe ser un número')
    .custom(value => value > 0).withMessage('La cantidad debe ser mayor que 0')
];

module.exports = validateConversion;
