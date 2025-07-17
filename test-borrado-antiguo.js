require('dotenv').config();
const mongoose = require('mongoose');
const Conversion = require('./models/Conversion');

async function testBorrado() {
  await mongoose.connect(process.env.MONGODB_URI);

  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - 60); // hace 60 días

  const resultado = await Conversion.deleteMany({ createdAt: { $lt: fechaLimite } });

  console.log(`🧪 Registros eliminados: ${resultado.deletedCount}`);

  await mongoose.disconnect();
}

testBorrado();
