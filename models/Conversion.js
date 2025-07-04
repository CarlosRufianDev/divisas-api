const mongoose = require('mongoose');

const conversionSchema = new mongoose.Schema({
  from: String,
  to: String,
  amount: Number,
  rate: Number,
  result: Number
}, { timestamps: true });
module.exports = mongoose.model('Conversion', conversionSchema);

