const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
// Este codigo define el modelo de usuario para la base de datos MongoDB.
// Utiliza Mongoose para definir un esquema con campos de email y contraseña.Siendo el email único y en minúsculas.
// El modelo se exporta para ser utilizado en otras partes de la aplicación, como en los controladores de autenticación.
// El esquema también incluye timestamps para registrar la fecha de creación y actualización del documento.
