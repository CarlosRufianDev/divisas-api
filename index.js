require('dotenv').config();
require('./cron/cleanupJob'); // Ejecuta la tarea programada
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const convertRoutes = require('./routes/convert');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', convertRoutes);

// Rutas de autenticación
// Aquí se manejan las rutas de autenticación para el registro y login de usuarios.
app.use('/api/auth', authRoutes);


// Conexión a MongoDB y arranque del servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));
