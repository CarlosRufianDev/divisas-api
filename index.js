require('dotenv').config();
require('./cron/cleanupJob');
require('./cron/alertJob');

// Importar dependencias y módulos necesarios
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const convertRoutes = require('./routes/convert');
const alertRoutes = require('./routes/alert'); 
const monedasRoutes = require('./routes/monedas');
const dashboardRoutes = require('./routes/dashboard');
const Conversion = require('./models/Conversion'); 
const calculatorRoutes = require('./routes/calculator');
const favoritesRoutes = require('./routes/favorites');
const favoriteCurrenciesRoutes = require('./routes/favoriteCurrencies');
const activityLogsRoutes = require('./routes/activityLogs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', convertRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes); 
app.use('/api/monedas', monedasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/favorite-currencies', favoriteCurrenciesRoutes);
app.use('/api/activity-logs', activityLogsRoutes); 

// Conexión a MongoDB y arranque del servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Conectado a MongoDB');

    // 🧹 Limpieza al arrancar (por si el cron no se ejecutó)
    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const result = await Conversion.deleteMany({ createdAt: { $lt: sixtyDaysAgo } });
      console.log(`🧹 Limpieza al iniciar el servidor: ${result.deletedCount} registros eliminados`);
    } catch (err) {
      console.error('❌ Error al hacer limpieza inicial:', err.message);
    }

    app.listen(PORT, () => console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));
