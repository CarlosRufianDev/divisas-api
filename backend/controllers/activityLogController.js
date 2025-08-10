const ActivityLog = require('../models/ActivityLog');

// Obtener logs de actividad del usuario con filtros
const getActivityLogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      action, // Filtrar por tipo de acción
      days = 30, // Últimos X días (por defecto 30)
      limit = 50, // Límite de resultados
      page = 1 // Página (para paginación)
    } = req.query;

    // Construir filtros
    const filters = { user: userId };

    // Filtro por fecha
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    filters.createdAt = { $gte: startDate };

    // Filtro por acción específica
    if (action) {
      filters.action = action;
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener logs con paginación
    const logs = await ActivityLog.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'email name');

    // Contar total para paginación
    const totalLogs = await ActivityLog.countDocuments(filters);
    const totalPages = Math.ceil(totalLogs / parseInt(limit));

    res.json({
      logs: logs.map(log => ({
        id: log._id,
        action: log.action,
        details: log.details,
        metadata: log.metadata,
        timestamp: log.createdAt,
        // Formatear para mejor legibilidad
        description: formatLogDescription(log)
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalLogs,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        action: action || 'all',
        days: parseInt(days),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los logs de actividad' });
  }
};

// Obtener estadísticas de actividad del usuario
const getActivityStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 30 } = req.query;

    // Usar el método estático del modelo
    const actionStats = await ActivityLog.getActivityStats(userId, parseInt(days));

    // Obtener estadísticas adicionales
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const totalLogs = await ActivityLog.countDocuments({
      user: userId,
      createdAt: { $gte: startDate }
    });

    // Estadísticas por día (últimos 7 días)
    const dailyStats = await ActivityLog.aggregate([
      {
        $match: {
          user: new ActivityLog.base.Types.ObjectId(userId),
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Estadísticas por categoría
    const categoryStats = {
      authentication: actionStats.filter(stat => ['LOGIN', 'LOGOUT', 'REGISTER'].includes(stat._id)).reduce((sum, stat) => sum + stat.count, 0),
      conversions: actionStats.filter(stat => stat._id.startsWith('CONVERSION_')).reduce((sum, stat) => sum + stat.count, 0),
      alerts: actionStats.filter(stat => stat._id.startsWith('ALERT_')).reduce((sum, stat) => sum + stat.count, 0),
      favorites: actionStats.filter(stat => stat._id.startsWith('FAVORITE_')).reduce((sum, stat) => sum + stat.count, 0),
      errors: actionStats.filter(stat => stat._id.startsWith('ERROR_')).reduce((sum, stat) => sum + stat.count, 0)
    };

    res.json({
      period: `Últimos ${days} días`,
      totalActivity: totalLogs,
      actionBreakdown: actionStats,
      dailyActivity: dailyStats,
      categoryStats,
      mostActiveDay: dailyStats.length > 0 ? dailyStats.reduce((max, day) => day.count > max.count ? day : max) : null
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas de actividad' });
  }
};

// Obtener acciones disponibles para filtros
const getAvailableActions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const actions = await ActivityLog.distinct('action', { user: userId });

    // Organizar por categorías
    const categorizedActions = {
      authentication: actions.filter(action => ['LOGIN', 'LOGOUT', 'REGISTER'].includes(action)),
      conversions: actions.filter(action => action.startsWith('CONVERSION_')),
      alerts: actions.filter(action => action.startsWith('ALERT_')),
      favorites: actions.filter(action => action.startsWith('FAVORITE_')),
      dashboard: actions.filter(action => ['DASHBOARD_VIEW', 'CURRENCIES_LIST', 'CALCULATOR_USE'].includes(action)),
      errors: actions.filter(action => action.startsWith('ERROR_'))
    };

    res.json({
      allActions: actions.sort(),
      categorized: categorizedActions,
      total: actions.length
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al obtener acciones disponibles' });
  }
};

// Función auxiliar para formatear descripciones legibles
function formatLogDescription(log) {
  const { action, details } = log;

  switch (action) {
    case 'LOGIN':
      return `Inicio de sesión desde ${details.ipAddress || 'IP desconocida'}`;

    case 'LOGOUT':
      return 'Cierre de sesión';

    case 'CONVERSION_SINGLE':
      return `Conversión: ${details.amount} ${details.from} → ${details.result} ${details.to}`;

    case 'CONVERSION_MULTIPLE':
      return `Conversión múltiple desde ${details.from} a ${details.to || 'varias monedas'}`;

    case 'ALERT_CREATE_SCHEDULED':
      return `Alerta programada creada: ${details.from}/${details.to}`;

    case 'ALERT_CREATE_PERCENTAGE':
      return `Alerta por porcentaje creada: ${details.from}/${details.to}`;

    case 'ALERT_CREATE_TARGET':
      return `Alerta por precio objetivo creada: ${details.from}/${details.to} → ${details.targetRate}`;

    case 'FAVORITE_PAIR_ADD':
      return `Par añadido a favoritos: ${details.favoritePair}`;

    case 'FAVORITE_CURRENCY_ADD':
      return `Moneda añadida a favoritas: ${details.favoriteCurrency}`;

    case 'DASHBOARD_VIEW':
      return 'Dashboard consultado';

    case 'ERROR_UNAUTHORIZED':
      return `Error de autorización: ${details.error}`;

    default:
      return `Acción: ${action}`;
  }
}

module.exports = {
  getActivityLogs,
  getActivityStats,
  getAvailableActions
};
