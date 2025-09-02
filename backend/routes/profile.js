const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const {
  getProfile,
  changePassword,
  changeEmail,
  changeUsername,
  deleteAccount
} = require('../controllers/profileController');

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Obtener datos del perfil
router.get('/', getProfile);

// Cambiar contraseña
router.put('/change-password', changePassword);

// Cambiar email
router.put('/change-email', changeEmail);

// Cambiar nombre de usuario
router.put('/change-username', changeUsername);

// Eliminar cuenta
router.delete('/delete-account', deleteAccount);

module.exports = router;
