const cron = require('node-cron');
const mongoose = require('mongoose');
const Conversion = require('../models/Conversion');
require('dotenv').config(); // Asegura que use las variables del .env

// Conectar a la base de datos si aún no está conectado
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(() => console.log('✅ Conectado a MongoDB para limpieza automática'))
    .catch(err => console.error('❌ Error al conectar a MongoDB:', err.message));
}

// 🕑 Esta tarea se ejecuta todos los días a las 2:00 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const resultado = await Conversion.deleteMany({ createdAt: { $lt: sixtyDaysAgo } });

    console.log(`🧹 Limpieza automática: ${resultado.deletedCount} registros eliminados`);
  } catch (error) {
    console.error('❌ Error al ejecutar la limpieza automática:', error.message);
  }
});

module.exports = cron;
