const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Autenticación
      'LOGIN', 'LOGOUT', 'REGISTER',

      // Conversiones
      'CONVERSION_SINGLE', 'CONVERSION_MULTIPLE', 'CONVERSION_INVERSE', 'CONVERSION_COMPARE', 'CONVERSION_HISTORICAL',

      // Alertas
      'ALERT_CREATE_SCHEDULED', 'ALERT_CREATE_PERCENTAGE', 'ALERT_CREATE_TARGET', 'ALERT_UPDATE', 'ALERT_DELETE',

      // Favoritos
      'FAVORITE_PAIR_ADD', 'FAVORITE_PAIR_UPDATE', 'FAVORITE_PAIR_DELETE',
      'FAVORITE_CURRENCY_ADD', 'FAVORITE_CURRENCY_UPDATE', 'FAVORITE_CURRENCY_DELETE',

      // Dashboard y consultas
      'DASHBOARD_VIEW', 'CURRENCIES_LIST', 'CALCULATOR_USE', 'CURRENCY_FILTER',

      // Perfil y cuenta
      'PROFILE_PASSWORD_CHANGED', 'PROFILE_EMAIL_CHANGED', 'PROFILE_USERNAME_CHANGED', 'ACCOUNT_DELETED', // ← AGREGAR ESTAS LÍNEAS

      // Errores importantes
      'ERROR_UNAUTHORIZED', 'ERROR_VALIDATION', 'ERROR_API_EXTERNAL'
    ]
  },
  details: {
    // Información específica de la acción
    from: String, // Moneda origen (para conversiones)
    to: String, // Moneda destino
    amount: Number, // Cantidad convertida
    result: Number, // Resultado de conversión
    alertType: String, // Tipo de alerta creada
    targetRate: Number, // Precio objetivo de alerta
    favoritePair: String, // Par añadido a favoritos (ej: "EUR/USD")
    favoriteCurrency: String, // Moneda añadida a favoritas
    error: String, // Mensaje de error si aplica
    ipAddress: String, // IP del usuario
    userAgent: String // Navegador/app del usuario
  },
  metadata: {
    // Información técnica adicional
    endpoint: String, // Endpoint llamado (ej: "/api/convert")
    httpMethod: String, // GET, POST, PUT, DELETE
    statusCode: Number, // 200, 400, 500, etc.
    responseTime: Number, // Tiempo de respuesta en ms
    apiVersion: String // Versión de la API
  }
}, {
  timestamps: true,
  // Índices para búsquedas eficientes
  index: {
    user: 1,
    action: 1,
    createdAt: -1
  }
});

// Índices compuestos para búsquedas comunes
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, action: 1, createdAt: -1 });

// Método estático para crear logs de forma sencilla
activityLogSchema.statics.createLog = function(userId, action, details = {}, metadata = {}) {
  return this.create({
    user: userId,
    action,
    details,
    metadata: {
      apiVersion: '1.0',
      ...metadata
    }
  });
};

// Método para obtener estadísticas de actividad
activityLogSchema.statics.getActivityStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate } } },
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return stats;
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
