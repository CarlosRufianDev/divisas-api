const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  
  // Campos existentes (compatibilidad hacia atrás)
  intervalDays: { type: Number },
  hour: { type: Number },
  email: { type: String, required: true },
  lastSent: { type: Date, default: null },
  
  // NUEVOS CAMPOS para alertas mejoradas
  alertType: { 
    type: String, 
    enum: ['scheduled', 'percentage', 'target'], 
    default: 'scheduled' 
  },
  
  // Para alertas por porcentaje
  percentageThreshold: { type: Number }, // Ej: 2 para +2%
  percentageDirection: { 
    type: String, 
    enum: ['up', 'down', 'both'], 
    default: 'both' 
  },
  baselineRate: { type: Number }, // Tipo de cambio de referencia
  
  // Para alertas por precio objetivo
  targetRate: { type: Number }, // Ej: 0.95 para USD/EUR
  targetDirection: { 
    type: String, 
    enum: ['above', 'below', 'exact'], 
    default: 'exact' 
  },
  
  // Estado de la alerta
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);