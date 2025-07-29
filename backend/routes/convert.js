const express = require('express');
const router = express.Router();
const {
  convertCurrency,
  getHistory,
  deleteAllHistory,
  deleteById,
  deleteUserHistory,
  deleteOldConversions
} = require('../controllers/convertController');
const validateConversion = require('../validators/convertValidator');
const { validationResult } = require('express-validator');
const requireAuth = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin'); // ✅ Importado para uso de admin
const { logConversion } = require('../middleware/activityLogger'); // ← Añadir esta línea

// Middleware para manejar errores de validación
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST para convertir divisas (sin autenticación)
router.post('/convert', validateConversion, handleValidation, convertCurrency);

// GET historial del usuario autenticado
router.get('/historial', requireAuth, getHistory);

// DELETE todo el historial del usuario autenticado
router.delete('/historial', requireAuth, deleteAllHistory);

// DELETE una conversión específica por ID (usuario autenticado)
router.delete('/historial/entry/:id', requireAuth, deleteById);

// DELETE historial completo de un usuario específico (solo admin)
router.delete('/historial/user/:userId', requireAuth, isAdmin, deleteUserHistory);

//
router.get('/clean-old', requireAuth, isAdmin, deleteOldConversions);

module.exports = router;
