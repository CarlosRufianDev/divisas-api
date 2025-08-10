const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login, deleteUser } = require('../controllers/authController');
const requireAuth = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Limitar intentos de login: máximo 5 intentos cada 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: { error: 'Demasiados intentos de login, intenta de nuevo más tarde.' }
});

// Middleware para manejar errores de validación
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Registro
router.post('/register', registerValidator, handleValidation, register);

// Login con limitador
router.post('/login', loginLimiter, loginValidator, handleValidation, login);

// Ruta protegida: eliminar usuario (requiere token y ser admin)
router.delete('/delete', requireAuth, isAdmin, deleteUser);

// Borrar la propia cuenta (requiere autenticación)
router.delete('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Tu cuenta ha sido eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
});

module.exports = router;
