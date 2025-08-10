const axios = require('axios');
const Conversion = require('../models/Conversion');
const jwt = require('jsonwebtoken');
const buildFilters = require('../utils/buildFilters');
const ActivityLog = require('../models/ActivityLog'); // ← Añadir esta línea

// URL de la API de Frankfurter
const API_URL = process.env.API_URL || 'https://api.frankfurter.app/latest';

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
    const apiUrl = `${API_URL}?amount=${amount}&from=${from}&to=${to}`;
    console.log('URL solicitada:', apiUrl);
    const response = await axios.get(apiUrl);

    if (!response.data.rates || response.data.rates[to] === undefined) {
      console.log('Respuesta inesperada de la API:', response.data);
      return res.status(400).json({ error: 'No se encontró la tasa de cambio para la moneda solicitada.' });
    }

    const rate = response.data.rates[to] / amount;
    const result = response.data.rates[to];

    // ✅ Intenta verificar el token (si se incluye)
    let userId = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        console.warn('Token inválido o expirado:', err.message);
        // No interrumpimos la conversión, se permite sin login
      }
    }

    // 💾 Guardar la conversión en la BD (con o sin usuario)
    const newConversion = await Conversion.create({
      from,
      to,
      amount,
      rate,
      result,
      user: userId || undefined,
      date: response.data.date
    });

    res.json({
      from,
      to,
      amount,
      rate,
      result: result.toFixed(2),
      date: response.data.date,
      user: userId || null,
      id: newConversion._id
    });

    // LOGGING MANUAL (temporal)
    if (req.user && req.user.userId) {
      try {
        await ActivityLog.createLog(
          req.user.userId,
          'CONVERSION_SINGLE',
          {
            from,
            to,
            amount: parseFloat(amount),
            result: convertedAmount,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
          },
          {
            endpoint: req.originalUrl,
            httpMethod: req.method,
            statusCode: 200,
            apiVersion: '1.0'
          }
        );
        console.log('✅ Log creado exitosamente');
      } catch (logError) {
        console.error('❌ Error creando log:', logError.message);
      }
    }

  } catch (error) {
    console.error('Error al convertir:', error.message);
    res.status(500).json({ error: 'Error al obtener el tipo de cambio' });
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
