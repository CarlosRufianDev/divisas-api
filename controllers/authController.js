const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });

  try {
    const userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ error: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error en el registro:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
// Este controlador maneja el registro de usuarios.

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({ message: 'Login exitoso', token });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
// Este controlador maneja el login de usuarios.

module.exports = { register, login };
// Este módulo exporta los controladores de autenticación para el registro y login de usuarios.
// Estos controladores utilizan Mongoose para interactuar con la base de datos MongoDB, bcryptjs para el hashing de contraseñas y jsonwebtoken para la generación de tokens de autenticación.
// Se asegura de que los datos de entrada sean válidos y maneja errores comunes como usuarios ya existentes o credenciales inválidas.