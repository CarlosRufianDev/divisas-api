const axios = require('axios');
const Conversion = require('../models/Conversion');
const Alert = require('../models/Alert');

// Lista de monedas soportadas (puedes ampliarla si Frankfurter añade más)
const supportedCurrencies = [
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD',
  'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD',
  'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR'
];

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

    const totalConversions = await Conversion.countDocuments({ user: userId });
    const lastConversions = await Conversion.find({ user: userId }).sort({ createdAt: -1 }).limit(3);
    const totalAlerts = await Alert.countDocuments({ user: userId });
    const nextAlerts = await Alert.find({ user: userId }).sort({ hour: 1 }).limit(3);

    const marketTrends = await getMarketTrends();

    res.json({
      totalConversions,
      lastConversions,
      totalAlerts,
      nextAlerts,
      marketTrends
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el dashboard' });
  }
};

module.exports = { getDashboard };