const Alert = require('../models/Alert');
const Conversion = require('../models/Conversion');
const Favorite = require('../models/Favorite');
const FavoriteCurrency = require('../models/FavoriteCurrency'); // ← AÑADIR ESTA LÍNEA
const axios = require('axios');
const mongoose = require('mongoose');

// Lista de monedas soportadas (puedes ampliarla si Frankfurter añade más)
const supportedCurrencies = [
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD',
  'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD',
  'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR'
]; // Este SÍ tiene más divisas, pero no se usa para exchange rates

// Genera todos los pares posibles entre monedas soportadas (excepto pares iguales)
function generatePairs(currencies) {
  const pairs = [];
  for (let i = 0; i < currencies.length; i++) {
    for (let j = 0; j < currencies.length; j++) {
      if (i !== j) {
        pairs.push({ from: currencies[i], to: currencies[j] });
      }
    }
  }
  return pairs;
}

const pairs = generatePairs(supportedCurrencies);

// Variables de caché
let marketCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos en milisegundos

async function getPairVariation(from, to) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const yyyy = weekAgo.getFullYear();
  const mm = String(weekAgo.getMonth() + 1).padStart(2, '0');
  const dd = String(weekAgo.getDate()).padStart(2, '0');
  const weekAgoStr = `${yyyy}-${mm}-${dd}`;

  try {
    const latestRes = await axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    const latest = latestRes.data.rates[to];

    const histRes = await axios.get(`https://api.frankfurter.app/${weekAgoStr}?from=${from}&to=${to}`);
    const past = histRes.data.rates[to];

    if (latest && past) {
      const percent = ((latest - past) / past) * 100;
      return {
        from,
        to,
        percent: Number(percent.toFixed(2)),
        latest,
        past
      };
    }
  } catch (err) {
    return null;
  }
  return null;
}

async function getMarketTrends() {
  // Si tenemos caché válido, lo devolvemos
  if (marketCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    console.log('📊 Usando datos de caché (market trends)');
    return marketCache;
  }

  console.log('🔄 Recalculando market trends...');
  
  // Si no, recalculamos y guardamos en caché
  const variations = await Promise.all(
    pairs.map(pair => getPairVariation(pair.from, pair.to))
  );

  const significantChanges = variations
    .filter(Boolean)
    .filter(change => Math.abs(change.percent) >= 1);

  const topGainers = significantChanges
    .filter(change => change.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3)
    .map(change => ({
      ...change,
      trend: '⬆️',
      description: `${change.from}/${change.to} subió ${change.percent}%`
    }));

  const topLosers = significantChanges
    .filter(change => change.percent < 0)
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3)
    .map(change => ({
      ...change,
      trend: '⬇️',
      description: `${change.from}/${change.to} bajó ${Math.abs(change.percent)}%`
    }));

  marketCache = {
    topGainers,
    topLosers,
    summary: `${topGainers.length} subidas y ${topLosers.length} bajadas significativas esta semana`
  };
  cacheTimestamp = Date.now();

  console.log('✅ Market trends calculados y guardados en caché');
  return marketCache;
}

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Datos existentes
    const totalConversions = await Conversion.countDocuments({ user: userId });
    const lastConversions = await Conversion.find({ user: userId }).sort({ createdAt: -1 }).limit(3);
    const totalAlerts = await Alert.countDocuments({ user: userId });
    const nextAlerts = await Alert.find({ user: userId }).sort({ hour: 1 }).limit(3);
    const favorites = await Favorite.find({ user: userId }).limit(5);

    // NUEVA FUNCIONALIDAD: Monedas favoritas
    const favoriteCurrencies = await FavoriteCurrency.find({ user: userId })
      .sort({ priority: 1, currency: 1 })
      .limit(5);

    // Obtener tipos de cambio para pares favoritos (existente)
    const favoritesWithRates = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          const response = await axios.get(`https://api.frankfurter.app/latest?from=${favorite.from}&to=${favorite.to}`);
          return {
            pair: `${favorite.from}/${favorite.to}`,
            nickname: favorite.nickname,
            rate: response.data.rates[favorite.to]
          };
        } catch (error) {
          return {
            pair: `${favorite.from}/${favorite.to}`,
            nickname: favorite.nickname,
            rate: 'Error'
          };
        }
      })
    );

    // NUEVA FUNCIONALIDAD: Obtener tipos de cambio para monedas favoritas vs EUR
    const favoriteCurrenciesWithRates = await Promise.all(
      favoriteCurrencies.map(async (favCurrency) => {
        try {
          if (favCurrency.currency === 'EUR') {
            // Si es EUR, mostrar vs USD
            const response = await axios.get(`https://api.frankfurter.app/latest?from=EUR&to=USD`);
            return {
              currency: favCurrency.currency,
              nickname: favCurrency.nickname,
              isDefault: favCurrency.isDefault,
              rate: response.data.rates.USD,
              pair: 'EUR/USD'
            };
          } else {
            // Para otras monedas, mostrar vs EUR
            const response = await axios.get(`https://api.frankfurter.app/latest?from=EUR&to=${favCurrency.currency}`);
            return {
              currency: favCurrency.currency,
              nickname: favCurrency.nickname,
              isDefault: favCurrency.isDefault,
              rate: response.data.rates[favCurrency.currency],
              pair: `EUR/${favCurrency.currency}`
            };
          }
        } catch (error) {
          return {
            currency: favCurrency.currency,
            nickname: favCurrency.nickname,
            isDefault: favCurrency.isDefault,
            rate: 'Error',
            pair: `EUR/${favCurrency.currency}`
          };
        }
      })
    );

    const marketTrends = await getMarketTrends();

    // Respuesta actualizada con monedas favoritas
    res.json({
      totalConversions,
      lastConversions,
      totalAlerts,
      nextAlerts,
      marketTrends,
      favoritos: {
        pares: {
          total: favorites.length,
          lista: favoritesWithRates
        },
        // NUEVA SECCIÓN: Monedas favoritas
        monedas: {
          total: favoriteCurrencies.length,
          lista: favoriteCurrenciesWithRates
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el dashboard' });
  }
};

// Estadísticas personales del usuario
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('🔍 Getting stats for user:', userId);
    
    // Total conversiones
    const totalConversions = await Conversion.countDocuments({ user: userId });
    
    // Volumen total convertido (suma de amounts)
    const volumeResult = await Conversion.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } }, // ✅ FIX: Añadir 'new'
      { $group: { _id: null, totalVolume: { $sum: "$amount" } } }
    ]);
    const totalVolume = volumeResult[0]?.totalVolume || 0;
    
    // Par más utilizado
    const topPairResult = await Conversion.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } }, // ✅ FIX: Añadir 'new'
      { $group: { 
          _id: { from: "$from", to: "$to" }, 
          count: { $sum: 1 } 
        }},
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const topPair = topPairResult[0] ? `${topPairResult[0]._id.from}→${topPairResult[0]._id.to}` : 'N/A';
    
    // Total alertas
    const totalAlerts = await Alert.countDocuments({ user: userId });
    
    // Conversiones esta semana vs semana anterior
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const thisWeekConversions = await Conversion.countDocuments({ 
      user: userId, 
      createdAt: { $gte: oneWeekAgo } 
    });
    
    const lastWeekConversions = await Conversion.countDocuments({ 
      user: userId, 
      createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo } 
    });
    
    const weeklyTrend = lastWeekConversions > 0 
      ? ((thisWeekConversions - lastWeekConversions) / lastWeekConversions * 100).toFixed(1)
      : thisWeekConversions > 0 ? 100 : 0;
    
    const stats = {
      totalConversions,
      totalVolume: totalVolume.toFixed(2),
      topPair,
      totalAlerts,
      weeklyTrend: `${weeklyTrend > 0 ? '+' : ''}${weeklyTrend}%`,
      thisWeekConversions,
      lastWeekConversions
    };
    
    console.log('✅ User stats calculated:', stats);
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Error getting user stats:', error);
    res.status(500).json({ error: 'Error getting user statistics' });
  }
};

// Tendencias de pares favoritos
const getFavoriteTrends = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Obtener pares favoritos del usuario
    const favorites = await Favorite.find({ user: userId }).limit(5);
    
    if (favorites.length === 0) {
      return res.json({ trends: [], message: 'No tienes pares favoritos aún' });
    }
    
    // Para cada par favorito, obtener datos de últimos 7 días
    const trends = await Promise.all(
      favorites.map(async (fav) => {
        try {
          // Obtener tasa actual
          const currentResponse = await axios.get(`https://api.frankfurter.app/latest?from=${fav.from}&to=${fav.to}`);
          const currentRate = currentResponse.data.rates[fav.to];
          
          // Obtener tasa hace 7 días
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const dateString = weekAgo.toISOString().split('T')[0];
          
          const pastResponse = await axios.get(`https://api.frankfurter.app/${dateString}?from=${fav.from}&to=${fav.to}`);
          const pastRate = pastResponse.data.rates[fav.to];
          
          const change = ((currentRate - pastRate) / pastRate * 100).toFixed(2);
          
          return {
            pair: `${fav.from}/${fav.to}`,
            nickname: fav.nickname,
            currentRate: currentRate.toFixed(4),
            pastRate: pastRate.toFixed(4),
            change: `${change > 0 ? '+' : ''}${change}%`,
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
          };
        } catch (error) {
          return {
            pair: `${fav.from}/${fav.to}`,
            nickname: fav.nickname,
            currentRate: 'Error',
            pastRate: 'Error',
            change: 'N/A',
            trend: 'error'
          };
        }
      })
    );
    
    res.json({ trends });
    
  } catch (error) {
    console.error('Error getting favorite trends:', error);
    res.status(500).json({ error: 'Error getting favorite trends' });
  }
};

module.exports = { 
  getDashboard, 
  getUserStats,    // ✅ NUEVO
  getFavoriteTrends // ✅ NUEVO
};