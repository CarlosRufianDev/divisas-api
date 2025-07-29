const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  from: { 
    type: String, 
    required: true,
    uppercase: true,
    minlength: 3,
    maxlength: 3
  },
  to: { 
    type: String, 
    required: true,
    uppercase: true,
    minlength: 3,
    maxlength: 3
  },
  nickname: { 
    type: String, 
    default: '' 
  }, // Ej: "Mi par principal", "Para viajes", etc.
  
  // Para evitar duplicados del mismo par por usuario
  userPair: {
    type: String,
    unique: true
  }
}, { 
  timestamps: true 
});

// Crear índice compuesto antes de guardar para evitar duplicados
favoriteSchema.pre('save', function(next) {
  this.userPair = `${this.user}_${this.from}_${this.to}`;
  next();
});

// Validar que from y to sean diferentes
favoriteSchema.pre('save', function(next) {
  if (this.from === this.to) {
    const error = new Error('Las monedas de origen y destino deben ser diferentes');
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Favorite', favoriteSchema);