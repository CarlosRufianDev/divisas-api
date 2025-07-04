const { body } = require('express-validator');

const validateConversion = [
  body('from')
    .notEmpty().withMessage('El campo "from" es obligatorio.')
    .isString().withMessage('"from" debe ser una cadena.'),
  body('to')
    .notEmpty().withMessage('El campo "to" es obligatorio.')
    .isString().withMessage('"to" debe ser una cadena.'),
  body('amount')
    .notEmpty().withMessage('El campo "amount" es obligatorio.')
    .isNumeric().withMessage('"amount" debe ser un número.')
    .custom(value => value > 0).withMessage('"amount" debe ser mayor que 0.')
];

module.exports = validateConversion;
// Este validador se encarga de validar los parámetros de la conversión de moneda.
// Utiliza express-validator para asegurarse de que los campos "from", "to" y