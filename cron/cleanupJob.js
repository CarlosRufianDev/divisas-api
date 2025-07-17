const cron = require('node-cron');
const Conversion = require('../models/Conversion');

// Esta tarea se ejecuta todos los días a las 2:00 AM
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