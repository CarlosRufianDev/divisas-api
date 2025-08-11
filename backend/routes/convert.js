const express = require('express');
const router = express.Router();
const {
  convertCurrency,
  getHistory,
  deleteAllHistory,
  deleteById,
  deleteUserHistory,
  deleteOldConversions
} = require('../controllers/convertController');
const validateConversion = require('../validators/convertValidator');
const { validationResult } = require('express-validator');
const requireAuth = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin'); // ✅ Importado para uso de admin
const Conversion = require('../models/Conversion');
const buildFilters = require('../utils/buildFilters');

// Middleware para manejar errores de validación
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST para convertir divisas (sin autenticación)
router.post('/convert', validateConversion, handleValidation, convertCurrency);

// GET historial del usuario autenticado
router.get('/historial', requireAuth, getHistory);

// DELETE todo el historial del usuario autenticado
router.delete('/historial', requireAuth, deleteAllHistory);

// DELETE una conversión específica por ID (usuario autenticado)
router.delete('/historial/entry/:id', requireAuth, deleteById);

// DELETE historial completo de un usuario específico (solo admin)
router.delete('/historial/user/:userId', requireAuth, isAdmin, deleteUserHistory);

//
router.get('/clean-old', requireAuth, isAdmin, deleteOldConversions);

// GET tipos de cambio múltiples basados en una moneda
router.get('/rates/:baseCurrency', async (req, res) => {
  try {
    const { baseCurrency } = req.params;

    // Validar que la moneda base sea válida
    const validCurrencies = [
      'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY',
      'MXN', 'BRL', 'KRW', 'INR', 'SEK', 'NOK',
      'HKD', 'SGD', 'NZD', 'ZAR', 'TRY', 'PLN'
    ]; // ✅ Ahora 20 divisas
    if (!validCurrencies.includes(baseCurrency.toUpperCase())) {
      return res.status(400).json({ error: 'Moneda base no válida' });
    }

    // ✅ CAMBIAR A FRANKFURTER (igual que en convertController.js)
    const response = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency.toUpperCase()}`);

    if (!response.ok) {
      throw new Error('Error al obtener tipos de cambio');
    }

    const data = await response.json();

    // Filtrar solo las monedas que soportamos
    const supportedRates = {};
    validCurrencies.forEach(currency => {
      if (data.rates[currency]) {
        supportedRates[currency] = data.rates[currency];
      }
    });

    res.json({
      base: baseCurrency.toUpperCase(),
      date: data.date,
      rates: supportedRates
    });

  } catch (error) {
    console.error('Error obteniendo tipos de cambio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET lista de divisas disponibles
router.get('/currencies', (req, res) => {
  const currencies = [
    { code: 'USD', name: 'Dólar Estadounidense', flag: '🇺🇸', symbol: '$' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
    { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧', symbol: '£' },
    { code: 'JPY', name: 'Yen Japonés', flag: '🇯🇵', symbol: '¥' },
    { code: 'CHF', name: 'Franco Suizo', flag: '🇨🇭', symbol: 'CHF' },
    { code: 'CAD', name: 'Dólar Canadiense', flag: '🇨🇦', symbol: 'C$' },
    { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺', symbol: 'A$' },
    { code: 'CNY', name: 'Yuan Chino', flag: '🇨🇳', symbol: '¥' },
    { code: 'MXN', name: 'Peso Mexicano', flag: '🇲🇽', symbol: '$' },
    { code: 'BRL', name: 'Real Brasileño', flag: '🇧🇷', symbol: 'R$' },
    { code: 'KRW', name: 'Won Surcoreano', flag: '🇰🇷', symbol: '₩' },
    { code: 'INR', name: 'Rupia India', flag: '🇮🇳', symbol: '₹' },
    { code: 'SEK', name: 'Corona Sueca', flag: '🇸🇪', symbol: 'kr' },
    { code: 'NOK', name: 'Corona Noruega', flag: '🇳🇴', symbol: 'kr' },
    { code: 'HKD', name: 'Dólar de Hong Kong', flag: '🇭🇰', symbol: 'HK$' },
    { code: 'SGD', name: 'Dólar de Singapur', flag: '🇸🇬', symbol: 'S$' },
    { code: 'NZD', name: 'Dólar Neozelandés', flag: '🇳🇿', symbol: 'NZ$' },
    { code: 'ZAR', name: 'Rand Sudafricano', flag: '🇿🇦', symbol: 'R' },
    { code: 'TRY', name: 'Lira Turca', flag: '🇹🇷', symbol: '₺' },
    { code: 'PLN', name: 'Zloty Polaco', flag: '🇵🇱', symbol: 'zł' }
  ]; // ✅ Ahora 20 divisas con símbolos

  res.json({
    success: true,
    currencies,
    total: currencies.length
  });
});

// Historial de conversiones del usuario autenticado
router.get('/history', requireAuth, async (req, res) => {
  try {
    const filters = buildFilters(req.query, req.user.userId);
    const history = await Conversion.find(filters).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo obtener el historial' });
  }
});

module.exports = router;
