/**
 * Script de mantenimiento/manual para eliminar conversiones antiguas (más de 60 días).
 * Útil para pruebas, mantenimiento y como ejemplo de automatización fuera del flujo principal.
 *
 * Uso:
 *   1. Asegúrate de tener la variable de entorno MONGODB_URI configurada.
 *   2. Ejecuta: node test-borrado-antiguo.js
 *
 * Este archivo NO forma parte del flujo principal de la API.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Conversion = require('../models/Conversion');

async function testBorrado() {
  await mongoose.connect(process.env.MONGODB_URI);

  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - 60); // hace 60 días

  const resultado = await Conversion.deleteMany({ createdAt: { $lt: fechaLimite } });

  console.log(`🧪 Registros eliminados: ${resultado.deletedCount}`);

  await mongoose.disconnect();
}

testBorrado();
