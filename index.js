require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const convertRoutes = require('./routes/convert');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', convertRoutes);


// Conexión a MongoDB y arranque del servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));
