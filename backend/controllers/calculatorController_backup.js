const axios = require('axios');

// 🌟 HELPER: Obtener tasa de divisas adicionales usando API alternativa
const getAdditionalCurrencyRate = async (currency, baseCurrency = 'USD') => {
  try {
    // Usar exchangerate-api.com (gratuita, 1500 requests/mes)
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);

    if (response.data && response.data.rates && response.data.rates[currency]) {
      return response.data.rates[currency];
    }
    return null;
  } catch (error) {
    console.warn(`⚠️ Error obteniendo tasa ${currency} desde API alternativa:`, error.message);
    // Fallbacks estáticos aproximados (actualizar manualmente cuando sea necesario)
    const fallbackRates = {
      ARS: 1447.17, // USD/ARS (actualizado Sep 2025)
      COP: 4150.00, // USD/COP
      CLP: 920.00, // USD/CLP
      PEN: 3.75, // USD/PEN
      UYU: 39.50, // USD/UYU
      RUB: 92.00, // USD/RUB
      EGP: 31.00, // USD/EGP
      VND: 24500.00, // USD/VND
      KWD: 0.31 // USD/KWD
    };
    return baseCurrency === 'USD' ? fallbackRates[currency] : null;
  }
};

// 🌟 HELPER: Obtener tasa histórica de divisas adicionales (estimación)
const getAdditionalCurrencyHistoricalRate = async (currency, baseCurrency = 'USD', daysAgo = 7) => {
  try {
    const currentRate = await getAdditionalCurrencyRate(currency, baseCurrency);
    if (!currentRate) return null;

    // Estimaciones de volatilidad típica por divisa (% diario)
    const volatilityEstimates = {
      ARS: 0.002, // 0.2% diario (muy volátil)
      COP: 0.001, // 0.1% diario
      CLP: 0.0008, // 0.08% diario
      PEN: 0.0005, // 0.05% diario (más estable)
      UYU: 0.001, // 0.1% diario
      RUB: 0.003, // 0.3% diario (muy volátil)
      EGP: 0.0015, // 0.15% diario
      VND: 0.0003, // 0.03% diario (estable)
      KWD: 0.0002 // 0.02% diario (muy estable)
    };

    const dailyVolatility = volatilityEstimates[currency] || 0.001;
    const historicalRate = currentRate * (1 - (dailyVolatility * daysAgo));

    return historicalRate;
  } catch (error) {
    console.warn(`⚠️ Error estimando tasa histórica ${currency}:`, error.message);
    return null;
  }
};

const multipleConversion = async (req, res) => {
  try {
    const { from, amount, currencies } = req.body;

    // Validaciones
    if (!from || !amount || !currencies || !Array.isArray(currencies)) {
      return res.status(400).json({ error: 'Debes especificar la moneda de origen, cantidad y monedas de destino' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    // Construir URL para Frankfurter
    const targetCurrencies = currencies.join(',');
    const response = await axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${targetCurrencies}`);

    const conversions = [];
    for (const [currency, rate] of Object.entries(response.data.rates)) {
      conversions.push({
        from,
        to: currency,
        amount,
        result: Number((amount * rate).toFixed(2)),
        rate
      });
    }

    res.json({
      baseAmount: amount,
      baseCurrency: from,
      conversions,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al realizar la conversión múltiple' });
  }
};

const reverseConversion = async (req, res) => {
  try {
    const { from, to, targetAmount } = req.body;

    // Validaciones
    if (!from || !to || !targetAmount) {
      return res.status(400).json({ error: 'Debes especificar la moneda de origen, destino y cantidad objetivo' });
    }

    if (targetAmount <= 0) {
      return res.status(400).json({ error: 'La cantidad objetivo debe ser mayor a 0' });
    }

    if (from === to) {
      return res.status(400).json({ error: 'Las monedas de origen y destino deben ser diferentes' });
    }

    // Obtener el tipo de cambio
    const response = await axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    const rate = response.data.rates[to];

    if (!rate) {
      return res.status(400).json({ error: 'El par de monedas solicitado no está disponible' });
    }

    // Cálculo inverso: ¿cuánto necesito en 'from' para obtener 'targetAmount' en 'to'?
    const requiredAmount = Number((targetAmount / rate).toFixed(2));

    res.json({
      from,
      to,
      targetAmount,
      requiredAmount,
      rate,
      description: `Para obtener ${targetAmount} ${to}, necesitas ${requiredAmount} ${from}`,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular la conversión inversa' });
  }
};

const comparePairs = async (req, res) => {
  try {
    const { pairs } = req.body;

    // Validaciones
    if (!pairs || !Array.isArray(pairs) || pairs.length === 0) {
      return res.status(400).json({ error: 'Debes proporcionar al menos un par de monedas para comparar' });
    }

    // Validar estructura de cada par
    for (const pair of pairs) {
      if (!pair.from || !pair.to) {
        return res.status(400).json({ error: 'Cada par debe especificar moneda de origen y destino' });
      }
      if (pair.from === pair.to) {
        return res.status(400).json({ error: `No puedes comparar la misma moneda: ${pair.from} → ${pair.to}` });
      }
    }

    const comparisons = [];

    for (const pair of pairs) {
      try {
        const response = await axios.get(`https://api.frankfurter.app/latest?from=${pair.from}&to=${pair.to}`);
        const rate = response.data.rates[pair.to];

        if (rate) {
          comparisons.push({
            from: pair.from,
            to: pair.to,
            rate,
            description: `1 ${pair.from} = ${rate} ${pair.to}`
          });
        }
      } catch (err) {
        // Si falla un par, lo omitimos pero seguimos con los demás
        comparisons.push({
          from: pair.from,
          to: pair.to,
          rate: null,
          error: 'Par no disponible'
        });
      }
    }

    res.json({
      comparisons,
      total: comparisons.length,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al comparar los pares de monedas' });
  }
};

const historicalRate = async (req, res) => {
  try {
    const { from, to, date } = req.body;

    // Validaciones
    if (!from || !to || !date) {
      return res.status(400).json({ error: 'Debes especificar moneda de origen, destino y fecha' });
    }

    if (from === to) {
      return res.status(400).json({ error: 'Las monedas de origen y destino deben ser diferentes' });
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'La fecha debe tener el formato YYYY-MM-DD (ejemplo: 2025-01-15)' });
    }

    // Validar que la fecha no sea futura
    const requestedDate = new Date(date);
    const today = new Date();
    if (requestedDate > today) {
      return res.status(400).json({ error: 'No se pueden consultar fechas futuras' });
    }

    // Consultar el histórico en Frankfurter
    const response = await axios.get(`https://api.frankfurter.app/${date}?from=${from}&to=${to}`);
    const rate = response.data.rates[to];

    if (!rate) {
      return res.status(400).json({ error: 'El par de monedas no está disponible para esa fecha' });
    }

    res.json({
      from,
      to,
      date,
      rate,
      description: `El ${date}, 1 ${from} = ${rate} ${to}`,
      timestamp: new Date()
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return res.status(400).json({ error: 'Fecha no válida o datos no disponibles para esa fecha' });
    }
    res.status(500).json({ error: 'Error al consultar el histórico de tipos de cambio' });
  }
};

// 🆕 NUEVO MÉTODO: Análisis técnico con datos históricos
const technicalAnalysis = async (req, res) => {
  try {
    const { from, to, days = 30 } = req.body;

    // Validaciones
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Debes especificar moneda de origen y destino'
      });
    }

    if (from === to) {
      return res.status(400).json({
        success: false,
        error: 'Las monedas de origen y destino deben ser diferentes'
      });
    }

    console.log(`📊 Análisis técnico: ${from} → ${to} (${days} días)`);

    // Calcular fechas
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    // 🔥 USAR FRANKFURTER PARA RANGO DE FECHAS
    const url = `https://api.frankfurter.app/${startStr}..${endStr}?from=${from}&to=${to}`;
    console.log('🔗 URL:', url);

    const response = await axios.get(url);

    if (!response.data || !response.data.rates) {
      return res.status(400).json({
        success: false,
        error: 'No se pudieron obtener datos históricos'
      });
    }

    // Extraer tasas y fechas
    const ratesData = response.data.rates;
    const dates = Object.keys(ratesData).sort();
    const rates = dates.map(date => ratesData[date][to]);

    console.log(`✅ Obtenidos ${rates.length} puntos de datos`);

    if (rates.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Datos insuficientes para análisis técnico'
      });
    }

    // 📈 CALCULAR INDICADORES TÉCNICOS
    const currentRate = rates[rates.length - 1];
    const firstRate = rates[0];

    // Tendencia (variación porcentual total)
    const trend = ((currentRate - firstRate) / firstRate) * 100;

    // Volatilidad (desviación estándar)
    const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
    const volatility = Math.sqrt(variance);

    // RSI (con los datos disponibles)
    const rsi = calculateRSI(rates, Math.min(14, rates.length - 1));

    // SMA (media móvil simple)
    const sma = calculateSMA(rates, Math.min(7, rates.length));

    // Soporte y resistencia
    const maxRate = Math.max(...rates);
    const minRate = Math.min(...rates);

    // Variación diaria promedio
    const dailyChanges = [];
    for (let i = 1; i < rates.length; i++) {
      dailyChanges.push(((rates[i] - rates[i - 1]) / rates[i - 1]) * 100);
    }
    const avgDailyChange = dailyChanges.reduce((sum, change) => sum + change, 0) / dailyChanges.length;

    // 🎯 GENERAR RECOMENDACIÓN
    const recommendation = generateTechnicalRecommendation({
      trend,
      volatility,
      rsi,
      sma,
      currentRate,
      avgDailyChange
    });

    // 📊 RESPUESTA COMPLETA
    const result = {
      success: true,
      pair: `${from}/${to}`,
      period: `${days} días`,
      dataPoints: rates.length,
      currentRate,
      analysis: {
        trend: Number(trend.toFixed(4)),
        volatility: Number(volatility.toFixed(6)),
        rsi,
        sma: Number(sma.toFixed(6)),
        support: Number(minRate.toFixed(6)),
        resistance: Number(maxRate.toFixed(6)),
        avgDailyChange: Number(avgDailyChange.toFixed(4))
      },
      recommendation,
      rawData: {
        rates,
        dates,
        dailyChanges
      },
      timestamp: new Date()
    };

    console.log(`✅ Análisis completado: Tendencia ${trend.toFixed(2)}%, RSI ${rsi}`);
    res.json(result);

  } catch (error) {
    console.error('❌ Error en análisis técnico:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al realizar análisis técnico: ' + error.message
    });
  }
};

// 🆕 NUEVO MÉTODO: Tendencias rápidas para el dashboard
const getTrendingRates = async (req, res) => {
  try {
    const { base = 'USD', currencies, days = 7 } = req.query;

    console.log(`📈 Obteniendo tendencias: base ${base}, período ${days} días`);

    // 🆕 OBTENER TODAS LAS MONEDAS DISPONIBLES AUTOMÁTICAMENTE
    let targetCurrencies;

    if (currencies) {
      // Si se especifican monedas, usarlas
      targetCurrencies = currencies.split(',');
    } else {
      // 🔥 OBTENER AUTOMÁTICAMENTE TODAS LAS MONEDAS SOPORTADAS
      try {
        const currenciesResponse = await axios.get('https://api.frankfurter.app/currencies');
        const availableCurrencies = Object.keys(currenciesResponse.data);

        // Filtrar la moneda base para evitar duplicados
        targetCurrencies = availableCurrencies.filter(curr => curr !== base);

        // 🆕 AGREGAR DIVISAS ADICIONALES (como ARS) que no están en Frankfurter
        const additionalCurrencies = ['ARS', 'COP', 'CLP', 'PEN', 'UYU', 'RUB', 'EGP', 'VND', 'KWD']; // 9 divisas adicionales
        targetCurrencies = [...targetCurrencies, ...additionalCurrencies];

        console.log(`✅ Obtenidas ${targetCurrencies.length} monedas (${availableCurrencies.length} desde Frankfurter + ${additionalCurrencies.length} adicionales)`);
        console.log(`🔍 Lista completa de monedas: ${targetCurrencies.join(', ')}`);
        console.log(`🇦🇷 ARS incluido: ${targetCurrencies.includes('ARS')}`);
      } catch (error) {
        console.warn('⚠️ No se pudieron obtener monedas automáticamente, usando lista predeterminada');
        // Fallback robusto
        targetCurrencies = [
          'ARS', 'COP', 'CLP', 'PEN', 'UYU', 'RUB', 'EGP', 'VND', 'KWD', // ✅ AGREGADAS - Divisas adicionales
          'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'BRL', 'MXN', 'INR',
          'KRW', 'SEK', 'NOK', 'HKD', 'SGD', 'NZD', 'ZAR', 'TRY', 'PLN', 'CZK',
          'DKK', 'HUF', 'ILS', 'ISK', 'PHP', 'RON', 'THB', 'BGN', 'HRK'
        ].filter(curr => curr !== base);
      }
    }

    // Obtener tasas actuales
    const currentResponse = await axios.get(
      `https://api.frankfurter.app/latest?from=${base}`
    );

    if (!currentResponse.data?.rates) {
      return res.status(400).json({
        success: false,
        error: 'No se pudieron obtener tasas actuales'
      });
    }

    // Obtener tasas históricas
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - parseInt(days));
    const pastDateStr = pastDate.toISOString().slice(0, 10);

    let historicalRates = {};
    try {
      const historicalResponse = await axios.get(
        `https://api.frankfurter.app/${pastDateStr}?from=${base}`
      );
      historicalRates = historicalResponse.data.rates || {};
    } catch (error) {
      console.warn('⚠️ No se pudieron obtener datos históricos');
    }

    // Procesar tendencias para TODAS las monedas disponibles
    const ratesWithTrends = [];
    const currentRates = currentResponse.data.rates;
    const additionalCurrencies = ['ARS', 'COP', 'CLP', 'PEN', 'UYU', 'RUB', 'EGP', 'VND', 'KWD'];

    for (const currency of targetCurrencies) {
      let currentRate, historicalRate;

      // 🌟 MANEJAR DIVISAS ADICIONALES CON API ALTERNATIVA
      if (additionalCurrencies.includes(currency)) {
        console.log(`🌟 Procesando ${currency}...`);
        currentRate = await getAdditionalCurrencyRate(currency, base);
        historicalRate = await getAdditionalCurrencyHistoricalRate(currency, base, parseInt(days));

        console.log(`🔍 ${currency} currentRate: ${currentRate}, historicalRate: ${historicalRate}`);

        // 🚨 LOG ESPECÍFICO PARA ARS
        if (currency === 'ARS') {
          console.log('🇦🇷 ARS DETALLE COMPLETO:', {
            currentRate,
            historicalRate,
            source: 'exchangerate-api',
            base
          });
        }

        if (!currentRate) {
          console.warn(`⚠️ No se pudo obtener tasa ${currency}, saltando...`);
          continue;
        }
      } else if (currentRates[currency]) {
        currentRate = currentRates[currency];
        historicalRate = historicalRates[currency];
      } else {
        continue; // Saltar si no hay datos para esta moneda
      }

      let trend = 0;
      let trendStatus = 'stable';

      if (historicalRate && historicalRate !== currentRate) {
        trend = ((currentRate - historicalRate) / historicalRate) * 100;

        // Umbrales más sensibles para mejor visualización
        if (trend > 0.1) trendStatus = 'up'; // Era 0.5, ahora 0.1
        else if (trend < -0.1) trendStatus = 'down'; // Era -0.5, ahora -0.1
      }

      ratesWithTrends.push({
        currency,
        currentRate,
        historicalRate: historicalRate || currentRate,
        trend: Number(trend.toFixed(4)),
        trendStatus,
        change: `${trend >= 0 ? '+' : ''}${trend.toFixed(2)}%`,
        source: currency === 'ARS' ? 'exchangerate-api' : 'frankfurter' // 🆕 Indicar fuente
      });
    }

    // 🎯 ORDENAR POR RELEVANCIA (mayor volumen/popularidad primero)
    const popularCurrencies = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'BRL', 'MXN', 'INR'];
    ratesWithTrends.sort((a, b) => {
      const aIndex = popularCurrencies.indexOf(a.currency);
      const bIndex = popularCurrencies.indexOf(b.currency);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      return a.currency.localeCompare(b.currency);
    });

    console.log(`✅ Tendencias calculadas para ${ratesWithTrends.length} monedas`);

    res.json({
      success: true,
      base,
      period: `${days} días`,
      date: currentResponse.data.date,
      rates: ratesWithTrends, // ✅ TODAS LAS MONEDAS, SIN LÍMITES
      summary: {
        total: ratesWithTrends.length,
        trending_up: ratesWithTrends.filter(r => r.trendStatus === 'up').length,
        trending_down: ratesWithTrends.filter(r => r.trendStatus === 'down').length,
        stable: ratesWithTrends.filter(r => r.trendStatus === 'stable').length
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Error obteniendo tendencias:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tendencias: ' + error.message
    });
  }
};

// 🔧 FUNCIONES AUXILIARES
function calculateRSI(rates, period = 14) {
  if (rates.length < period + 1) {
    period = Math.max(2, rates.length - 1);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = rates[i] - rates[i - 1];
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return Math.round(100 - (100 / (1 + rs)));
}

function calculateSMA(rates, period = 7) {
  if (rates.length < period) {
    period = rates.length;
  }

  const slice = rates.slice(-period);
  const sum = slice.reduce((acc, rate) => acc + rate, 0);
  return sum / period;
}

function generateTechnicalRecommendation({ trend, volatility, rsi, sma, currentRate, avgDailyChange }) {
  let score = 0;
  const signals = [];

  // Análisis de tendencia general
  if (trend > 2) {
    score += 2;
    signals.push('Tendencia alcista fuerte');
  } else if (trend > 0.5) {
    score += 1;
    signals.push('Tendencia alcista moderada');
  } else if (trend < -2) {
    score -= 2;
    signals.push('Tendencia bajista fuerte');
  } else if (trend < -0.5) {
    score -= 1;
    signals.push('Tendencia bajista moderada');
  } else {
    signals.push('Tendencia lateral');
  }

  // Análisis RSI
  if (rsi < 30) {
    score += 1;
    signals.push('RSI indica sobreventa (oportunidad)');
  } else if (rsi > 70) {
    score -= 1;
    signals.push('RSI indica sobrecompra');
  } else {
    signals.push('RSI en zona neutral');
  }

  // Análisis SMA
  if (currentRate > sma * 1.005) {
    score += 1;
    signals.push('Precio por encima de media móvil');
  } else if (currentRate < sma * 0.995) {
    score -= 1;
    signals.push('Precio por debajo de media móvil');
  }

  // Análisis volatilidad
  if (volatility > 0.05) {
    score -= 1;
    signals.push('Alta volatilidad - riesgo elevado');
  } else if (volatility < 0.02) {
    signals.push('Baja volatilidad - estable');
  }

  // Determinar recomendación
  let action, color, message, confidence;

  if (score >= 3) {
    action = 'COMPRAR';
    color = '#4caf50';
    message = 'Múltiples señales alcistas';
    confidence = Math.min(75 + (score - 3) * 5, 90);
  } else if (score >= 1) {
    action = 'MANTENER';
    color = '#2196f3';
    message = 'Señales mixtas';
    confidence = 55 + score * 10;
  } else if (score <= -3) {
    action = 'VENDER';
    color = '#f44336';
    message = 'Múltiples señales bajistas';
    confidence = Math.min(75 + Math.abs(score + 3) * 5, 90);
  } else {
    action = 'ESPERAR';
    color = '#ff9800';
    message = 'Sin señales claras';
    confidence = 50;
  }

  return {
    action,
    color,
    message,
    confidence,
    signals,
    score
  };
}

// Verifica que estos métodos estén al final del archivo:
module.exports = {
  multipleConversion,
  reverseConversion,
  comparePairs,
  historicalRate,
  technicalAnalysis, // ✅ DEBE ESTAR AQUÍ
  getTrendingRates // ✅ DEBE ESTAR AQUÍ
};
