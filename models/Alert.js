// filepath: c:\PROYECTOS\divisas-api\models\Alert.js
const mongoose = require('mongoose');
const alertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  intervalDays: { type: Number, default: 1 },
  lastSent: { type: Date, default: null },
  email: { type: String, required: true }
});
module.exports = mongoose.model('Alert', alertSchema);