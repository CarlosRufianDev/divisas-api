const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

// Middleware para registrar actividades automáticamente
const logActivity = (action, extractDetails = null) => {
  return async (req, res, next) => {
    // Ejecutar el controlador original
    const originalSend = res.send;
    const startTime = Date.now();

    res.send = function(data) {
      // Calcular tiempo de respuesta
      const responseTime = Date.now() - startTime;

      // Registrar actividad si el usuario está autenticado
      if (req.user && req.user.userId) {
        const logData = {
          userId: req.user.userId,
          action,
          details: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            ...(extractDetails ? extractDetails(req, res, data) : {})
          },
          metadata: {
            endpoint: req.originalUrl,
            httpMethod: req.method,
            statusCode: res.statusCode,
            responseTime,
            apiVersion: '1.0'
          }
        };

        // Registrar async sin bloquear la respuesta
        ActivityLog.createLog(
          logData.userId,
          logData.action,
          logData.details,
          logData.metadata
        ).catch(err => {
          console.error('❌ Error registrando actividad:', err.message);
        });
      }

      // Enviar respuesta original
      originalSend.call(this, data);
    };

    next();
  };
};

// Funciones auxiliares para extraer detalles específicos
const extractConversionDetails = (req, res, data) => {
  const { from, to, amount } = req.body || req.query;
  let result = null;

  try {
    const responseData = typeof data === 'string' ? JSON.parse(data) : data;
    result = responseData.result || responseData.convertedAmount;
  } catch (e) {
    // Si no se puede parsear, ignorar
  }

  return {
    from,
    to,
    amount: parseFloat(amount),
    result
  };
};

const extractAlertDetails = (req, res, data) => {
  const { from, to, alertType, targetRate, percentageThreshold } = req.body;

  return {
    from,
    to,
    alertType,
    targetRate,
    percentageThreshold
  };
};

const extractFavoriteDetails = (req, res, data) => {
  const { from, to, currency, nickname } = req.body;

  const details = {};

  if (from && to) {
    details.favoritePair = `${from}/${to}`;
  }

  if (currency) {
    details.favoriteCurrency = currency;
  }

  if (nickname) {
    details.nickname = nickname;
  }

  return details;
};

const extractErrorDetails = (req, res, data) => {
  let errorMessage = 'Error desconocido';

  try {
    const responseData = typeof data === 'string' ? JSON.parse(data) : data;
    errorMessage = responseData.error || responseData.message || 'Error sin mensaje';
  } catch (e) {
    // Si no se puede parsear, usar mensaje por defecto
  }

  return {
    error: errorMessage,
    endpoint: req.originalUrl
  };
};

// Middleware específicos para diferentes tipos de actividad
const logLogin = logActivity('LOGIN', (req, res, data) => ({
  ipAddress: req.ip || req.connection.remoteAddress,
  userAgent: req.get('User-Agent')
}));

const logLogout = logActivity('LOGOUT');

const logConversion = logActivity('CONVERSION_SINGLE', extractConversionDetails);
const logConversionMultiple = logActivity('CONVERSION_MULTIPLE', extractConversionDetails);
const logConversionInverse = logActivity('CONVERSION_INVERSE', extractConversionDetails);
const logConversionCompare = logActivity('CONVERSION_COMPARE', extractConversionDetails);
const logConversionHistorical = logActivity('CONVERSION_HISTORICAL', extractConversionDetails);

const logAlertCreate = (alertType) => logActivity(`ALERT_CREATE_${alertType.toUpperCase()}`, extractAlertDetails);
const logAlertUpdate = logActivity('ALERT_UPDATE', extractAlertDetails);
const logAlertDelete = logActivity('ALERT_DELETE');

const logFavoritePairAdd = logActivity('FAVORITE_PAIR_ADD', extractFavoriteDetails);
const logFavoritePairUpdate = logActivity('FAVORITE_PAIR_UPDATE', extractFavoriteDetails);
const logFavoritePairDelete = logActivity('FAVORITE_PAIR_DELETE');

const logFavoriteCurrencyAdd = logActivity('FAVORITE_CURRENCY_ADD', extractFavoriteDetails);
const logFavoriteCurrencyUpdate = logActivity('FAVORITE_CURRENCY_UPDATE', extractFavoriteDetails);
const logFavoriteCurrencyDelete = logActivity('FAVORITE_CURRENCY_DELETE');

const logDashboardView = logActivity('DASHBOARD_VIEW');
const logCalculatorUse = logActivity('CALCULATOR_USE');

const logError = (errorType) => logActivity(`ERROR_${errorType.toUpperCase()}`, extractErrorDetails);

module.exports = {
  logActivity,
  logLogin,
  logLogout,
  logConversion,
  logConversionMultiple,
  logConversionInverse,
  logConversionCompare,
  logConversionHistorical,
  logAlertCreate,
  logAlertUpdate,
  logAlertDelete,
  logFavoritePairAdd,
  logFavoritePairUpdate,
  logFavoritePairDelete,
  logFavoriteCurrencyAdd,
  logFavoriteCurrencyUpdate,
  logFavoriteCurrencyDelete,
  logDashboardView,
  logCalculatorUse,
  logError
};
