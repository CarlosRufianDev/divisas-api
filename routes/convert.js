const express = require('express');
const router = express.Router();
const { convertCurrency, getHistory, deleteAllHistory, deleteById } = require('../controllers/convertController');
const validateConversion = require('../validators/convertValidator');
const { validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST para convertir, ahora con validación
router.post('/convert', validateConversion, handleValidation, convertCurrency);

// GET para historial
router.get('/historial', getHistory);

// DELETE para borrar todo el historial
router.delete('/historial', deleteAllHistory);

// DELETE una conversión por ID
router.delete('/historial/:id', deleteById);


module.exports = router;
// Este archivo define las rutas para la conversión de divisas y el historial de conversiones.
// Utiliza un controlador para manejar la lógica de negocio y un validador para validar las solicitudes de conversión.
// También incluye un middleware para manejar errores de validación y devolver respuestas adecuadas al cliente. 
