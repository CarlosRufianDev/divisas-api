const User = require('../models/User');
const Conversion = require('../models/Conversion');
const Favorite = require('../models/Favorite');
const FavoriteCurrency = require('../models/FavoriteCurrency');
const Alert = require('../models/Alert');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Validar entrada
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Buscar usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    // Encriptar nueva contraseña
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    // Log de actividad
    await ActivityLog.createLog(userId, 'PROFILE_PASSWORD_CHANGED', {
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Cambiar email
exports.changeEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const userId = req.user.userId;

    // Validar entrada
    if (!newEmail || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ message: 'Formato de email inválido' });
    }

    // Buscar usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    // Verificar que el email no esté en uso
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ message: 'Este email ya está en uso' });
    }

    const oldEmail = user.email;

    // Actualizar email
    await User.findByIdAndUpdate(userId, { email: newEmail });

    // Log de actividad
    await ActivityLog.createLog(userId, 'PROFILE_EMAIL_CHANGED', {
      ipAddress: req.ip || req.connection.remoteAddress,
      error: `Cambió de ${oldEmail} a ${newEmail}`
    });

    res.json({ message: 'Email actualizado correctamente' });
  } catch (error) {
    console.error('Error al cambiar email:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Cambiar nombre de usuario
exports.changeUsername = async (req, res) => {
  try {
    const { newUsername } = req.body;
    const userId = req.user.userId;

    // Validar entrada
    if (!newUsername) {
      return res.status(400).json({ message: 'El nombre de usuario es requerido' });
    }

    if (newUsername.length < 3) {
      return res.status(400).json({ message: 'El nombre de usuario debe tener al menos 3 caracteres' });
    }

    // Buscar usuario actual
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que el nombre de usuario no esté en uso (si existe el campo name)
    const existingUser = await User.findOne({ name: newUsername });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ message: 'Este nombre de usuario ya está en uso' });
    }

    const oldName = user.name;

    // Actualizar nombre de usuario
    await User.findByIdAndUpdate(userId, { name: newUsername });

    // Log de actividad
    await ActivityLog.createLog(userId, 'PROFILE_USERNAME_CHANGED', {
      ipAddress: req.ip || req.connection.remoteAddress,
      error: `Cambió de "${oldName || 'sin nombre'}" a "${newUsername}"`
    });

    res.json({ message: 'Nombre de usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al cambiar nombre de usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Eliminar cuenta
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;

    // Validar entrada
    if (!password) {
      return res.status(400).json({ message: 'La contraseña es requerida para eliminar la cuenta' });
    }

    // Buscar usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    // Log de actividad antes de eliminar
    await ActivityLog.createLog(userId, 'ACCOUNT_DELETED', {
      ipAddress: req.ip || req.connection.remoteAddress,
      error: `Usuario ${user.email} eliminó su cuenta`
    });

    // Eliminar todos los datos relacionados en paralelo
    await Promise.all([
      Conversion.deleteMany({ user: userId }),
      Favorite.deleteMany({ user: userId }),
      FavoriteCurrency.deleteMany({ user: userId }),
      Alert.deleteMany({ user: userId }),
      ActivityLog.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId)
    ]);

    res.json({ message: 'Cuenta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener datos del perfil
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
