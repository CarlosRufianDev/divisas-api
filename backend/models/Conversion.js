const mongoose = require('mongoose');
const Conversion = require('../models/Conversion');
const conversionSchema = new mongoose.Schema({
  from: String,
  to: String,
  amount: Number,
  rate: Number,
  result: Number,
  date: String, // <-- opcional, si quieres registrar la fecha de la API externa
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // ← permite conversiones sin usuario autenticado
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversion', conversionSchema);
