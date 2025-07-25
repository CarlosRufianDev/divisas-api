const User = require('../models/User');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Controlador de autenticación para registro y login de usuarios

// Registro 
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const email = req.body.email;
  const { password, role, name } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }

    // NO hagas hash aquí, pásala tal cual
    const user = new User({ email, password, role, name });
    await user.save();

    res.status(201).json({ message: 'Usuario registrado correctamente', userId: user._id });
  } catch (error) {
    console.error('Error en el registro:', error.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Login
const login = async (req, res) => {
  const email = req.body.email;
  const { password } = req.body;
  console.log('Login email:', email);
  console.log('Login password:', password);

  try {
    const user = await User.findOne({ email });
    console.log('Usuario encontrado:', user); // <-- Agrega este log

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const match = await bcrypt.compare(password, user.password);
    console.log('¿Contraseña coincide?', match); // <-- Y este log

    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ message: 'Login exitoso', token });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

const deleteUser = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await User.deleteOne({ email });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = { register, login, deleteUser };
