const axios = require('axios');

// Lista completa de divisas que quieres soportar
const supportedCurrencies = [
  // ✅ Solo las que SÍ están disponibles en Frankfurter:
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 
  'MXN', 'BRL', 'KRW', 'INR', 'SEK', 'NOK',
  'HKD', 'SGD', 'NZD', 'ZAR', 'TRY', 'PLN',
  'DKK', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'ISK', 'ILS'
];

// Obtener tipos de cambio desde una moneda base
const getExchangeRates = async (req, res) => {
  try {
    const { base = 'USD' } = req.query;

    // ✅ SOLICITAR TODAS LAS DIVISAS (sin filtrar)
    const apiUrl = `https://api.frankfurter.app/latest?from=${base}`;
    console.log('🔗 Solicitando tipos de cambio:', apiUrl);
    
    const response = await axios.get(apiUrl);
    
    if (!response.data || !response.data.rates) {
      return res.status(400).json({ error: 'No se pudieron obtener los tipos de cambio' });
    }

    // ✅ DEBUG: Ver QUÉ divisas devuelve Frankfurter
    console.log('🔍 TODAS las divisas de Frankfurter:', Object.keys(response.data.rates));
    console.log('🔍 Total divisas disponibles:', Object.keys(response.data.rates).length);

    // ✅ USAR TODAS las divisas que devuelve Frankfurter (sin filtrar)
    const allRates = response.data.rates;

    console.log(`✅ Enviando ${Object.keys(allRates).length} divisas al frontend`);

    res.json({
      base: response.data.base,
      date: response.data.date,
      rates: allRates  // ✅ Enviar TODAS las divisas, no filtradas
    });

  } catch (error) {
    console.error('❌ Error obteniendo tipos de cambio:', error.message);
    res.status(500).json({ error: 'Error al obtener tipos de cambio' });
  }
};

module.exports = {
  getExchangeRates
};