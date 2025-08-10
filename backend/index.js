require('dotenv').config();
require('./cron/cleanupJob');
require('./cron/alertJob');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { config } = require('./config/config');
const requestContext = require('./middleware/requestContext');
const errorHandler = require('./middleware/errorHandler');

// Importar rutas
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
const exchangeController = require('./controllers/exchangeController');

const app = express();
const PORT = config.PORT; // ← FIX agregado

// Inserta request context al inicio
app.use(requestContext);

// Seguridad base
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // permite herramientas locales (Postman)
    if (config.ALLOWED_ORIGIN_LIST.includes(origin)) return callback(null, true);
    return callback(new Error('CORS_NOT_ALLOWED'));
  },
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Rate limit (ajusta si necesitas más throughput)
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
}));

// Body parser con límite
app.use(express.json({ limit: '100kb' }));

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
app.get('/api/exchange/rates', exchangeController.getExchangeRates); // ✅ AÑADIR esta ruta

// 404 handler (después de rutas)
app.use((req, res) => {
  return res.status(404).json({
    error: 'Recurso no encontrado',
    requestId: req.requestId
  });
});

// Reemplaza manejador inline por middleware externo
app.use(errorHandler);

// Conexión a MongoDB y arranque del servidor
mongoose.connect(config.MONGODB_URI)
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
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
  });

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});
