const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Registro
router.post('/register', register);

// Login
router.post('/login', login);

module.exports = router;
// Este archivo define las rutas de autenticación para el registro y login de usuarios.
// Utiliza el controlador de autenticación para manejar las solicitudes POST a las rutas /register y /login.
// Se exporta el router para ser utilizado en la configuración principal de la aplicación Express.