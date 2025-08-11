const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')

// Registro
const register = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password, role, name, username } = req.body
  const displayName = name || username

  try {
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(409).json({ error: 'El usuario ya existe' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = new User({ email, password: hashed, role, name: displayName })
    await user.save()

    return res.status(201).json({ message: 'Usuario registrado correctamente', userId: user._id })
  } catch (error) {
    console.error('Error en el registro:', error.message)
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

// Login
const login = async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    )

    return res.json({ message: 'Login exitoso', token })
  } catch (error) {
    console.error('Error en el login:', error)
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

const deleteUser = async (req, res) => {
  const { email } = req.body
  try {
    const result = await User.deleteOne({ email })
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    return res.json({ message: 'Usuario eliminado' })
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' })
  }
}

module.exports = { register, login, deleteUser }
