const axios = require('axios');
const Conversion = require('../models/Conversion');
const jwt = require('jsonwebtoken');
const buildFilters = require('../utils/buildFilters');
const ActivityLog = require('../models/ActivityLog'); // ← Añadir esta línea

// URL de la API de Frankfurter
const API_URL = process.env.API_URL || 'https://api.frankfurter.app/latest';

// 🌟 DIVISAS ADICIONALES NO DISPONIBLES EN FRANKFURTER (exchangerate-api)
const ADDITIONAL_CURRENCIES = ['ARS', 'COP', 'CLP', 'PEN', 'UYU', 'RUB', 'EGP', 'VND', 'KWD'];

// 🔗 Función para obtener conversión desde exchangerate-api
const getAdditionalCurrencyConversion = async (from, to) => {
  try {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);
    const rate = response.data.rates[to];

    if (!rate) {
      throw new Error(`No se encontró conversión para ${from} a ${to} en exchangerate-api`);
    }

    console.log(`✅ Conversión adicional obtenida: ${from} → ${to} = ${rate}`);
    return rate;
  } catch (error) {
    console.error(`❌ Error en exchangerate-api para ${from}→${to}:`, error.message);
    throw error;
  }
};

// Convertir moneda
// Requiere: from, to, amount
// Respuesta: { from, to, amount, rate, result, date, user (si está autenticado), id }
const convertCurrency = async (req, res) => {
  const { from, to, amount } = req.body;

  // Validaciones básicas
  if (!from || !to || amount === undefined) {
    return res.status(400).json({ error: 'Faltan parámetros: from, to o amount' });
  }

  if (typeof from !== 'string' || typeof to !== 'string' || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Tipos inválidos. from y to deben ser strings, amount debe ser número.' });
  }

  if (from.length !== 3 || to.length !== 3) {
    return res.status(400).json({ error: 'Los códigos de moneda deben tener 3 letras (por ejemplo, USD, EUR).' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'La cantidad debe ser mayor que 0.' });
  }

  try {
    let rate;
    let apiUsed = 'frankfurter';

    // 🔄 LÓGICA DUAL: Decidir qué API usar basado en las monedas
    const needsAdditionalAPI = ADDITIONAL_CURRENCIES.includes(from) || ADDITIONAL_CURRENCIES.includes(to);

    if (needsAdditionalAPI) {
      // 📊 Usar exchangerate-api para monedas adicionales
      console.log(`🌟 Usando exchangerate-api para conversión: ${from} → ${to}`);
      rate = await getAdditionalCurrencyConversion(from, to);
      apiUsed = 'exchangerate-api';
    } else {
      // 📊 Usar Frankfurter para monedas soportadas
      console.log(`🏛️ Usando Frankfurter para conversión: ${from} → ${to}`);
      const apiUrl = `${API_URL}?from=${from}&to=${to}`;
      console.log('URL solicitada:', apiUrl);
      const response = await axios.get(apiUrl);

      if (!response.data.rates || response.data.rates[to] === undefined) {
        return res.status(400).json({ error: `No se encontró el tipo de cambio para ${from} a ${to}` });
      }

      rate = response.data.rates[to];
    }

    // ✅ Calcular el resultado
    const result = amount * rate;

    console.log('🔍 DEBUG Conversion response:', {
      apiUsed,
      rate,
      amount,
      calculatedResult: result
    });

    // ✅ Intenta verificar el token (si se incluye)
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('✅ Token válido:', decoded.userId);
      } catch (tokenError) {
        console.log('⚠️ Token inválido o expirado, pero continuando sin usuario');
      }
    }

    // 💾 Guardar la conversión en la BD (con usuario)
    let savedConversion = null;
    if (req.user && req.user.userId) {
      try {
        savedConversion = new Conversion({
          from,
          to,
          amount,
          rate,
          result,
          user: req.user.userId,
          date: new Date()
        });
        await savedConversion.save();

        // Registrar actividad
        await ActivityLog.create({
          user: req.user.userId,
          action: 'CONVERSION_SINGLE',
          details: { from, to, amount, result, apiUsed },
          metadata: { from, to, amount, rate, result, apiUsed }
        });

        console.log('✅ Conversión guardada en BD');
      } catch (saveError) {
        console.error('❌ Error guardando conversión:', saveError.message);
      }
    }

    res.json({
      from,
      to,
      amount,
      rate,
      result,
      date: new Date(),
      conversionId: savedConversion ? savedConversion._id : null,
      apiUsed
    });

  } catch (error) {
    console.error('❌ Error en conversión:', error.message);

    if (error.response && error.response.status === 404) {
      return res.status(400).json({ error: 'Una o ambas monedas no son válidas' });
    }

    res.status(500).json({ error: 'Error interno del servidor al realizar la conversión' });
  }
};

// Obtener el historial de conversiones
// Permite filtrar por moneda, usuario y fecha
// Paginación: ?page=1&limit=10
// Ejemplo de filtros: ?from=USD&to=EUR&user=123&startDate=2023-01-01&endDate=2023-12-31
const getHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = buildFilters(req.query, userId);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [conversions, total] = await Promise.all([
      Conversion.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Conversion.countDocuments(filters)
    ]);

    res.json({
      page,
      limit,
      total,
      count: conversions.length,
      results: conversions
    });
  } catch (error) {
    console.error('Error al obtener historial:', error.message);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

// Eliminar una conversión por ID
// Solo el usuario que la creó puede eliminarla
const deleteById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversionId = req.params.id;

    const conversion = await Conversion.findById(conversionId);

    if (!conversion) {
      return res.status(404).json({ error: 'Conversión no encontrada' });
    }

    // Solo puede eliminar su propia conversión
    if (!conversion.user || conversion.user.toString() !== userId) {
      return res.status(403).json({ error: 'No autorizado para eliminar esta conversión' });
    }

    await Conversion.findByIdAndDelete(conversionId);

    res.json({ message: 'Conversión eliminada correctamente' });

  } catch (error) {
    console.error('Error al eliminar conversión:', error.message);
    res.status(500).json({ error: 'Error al eliminar conversión' });
  }
};

// Eliminar todo el historial del usuario autenticado
// Solo el usuario autenticado puede eliminar su historial
// No se permite eliminar el historial de otros usuarios
const deleteAllHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await Conversion.deleteMany({ user: userId });

    res.json({
      message: 'Historial eliminado correctamente',
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error al eliminar historial:', error.message);
    res.status(500).json({ error: 'Error al eliminar historial' });
  }
};

// Eliminar el historial de un usuario específico por userId
// Solo un administrador o el propio usuario pueden hacerlo
// Requiere: userId en la URL
const deleteUserHistory = async (req, res) => {
  const userIdToDelete = req.params.userId;

  if (!userIdToDelete) {
    return res.status(400).json({ error: 'Falta el userId en la URL' });
  }

  try {
    const result = await Conversion.deleteMany({ user: userIdToDelete });

    res.json({
      message: `Historial del usuario ${userIdToDelete} eliminado correctamente`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error al borrar historial del usuario:', error.message);
    res.status(500).json({ error: 'Error al borrar historial del usuario' });
  }
};

// Eliminar conversiones antiguas (más de 60 días)
// Solo accesible por un administrador
const deleteOldConversions = async (req, res) => {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // hace 60 días

  try {
    const result = await Conversion.deleteMany({ createdAt: { $lt: sixtyDaysAgo } });

    res.json({
      message: 'Registros antiguos eliminados correctamente',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error al eliminar registros antiguos:', error.message);
    res.status(500).json({ error: 'Error al eliminar registros antiguos' });
  }
};

// Exportar las funciones del controlador
module.exports = {
  convertCurrency,
  getHistory,
  deleteById,
  deleteAllHistory,
  deleteUserHistory,
  deleteOldConversions
};
