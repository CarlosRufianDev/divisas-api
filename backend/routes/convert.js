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
const { logConversion } = require('../middleware/activityLogger'); // ← Añadir esta línea

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
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
    if (!validCurrencies.includes(baseCurrency.toUpperCase())) {
      return res.status(400).json({ error: 'Moneda base no válida' });
    }

    // Llamar a la API externa para obtener todos los tipos de cambio
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency.toUpperCase()}`);
    
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
    { code: 'CAD', name: 'Dólar Canadiense', flag: '🇨🇦', symbol: 'C$' },
    { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺', symbol: 'A$' },
    { code: 'CHF', name: 'Franco Suizo', flag: '🇨🇭', symbol: 'CHF' },
    { code: 'CNY', name: 'Yuan Chino', flag: '🇨🇳', symbol: '¥' }
  ];

  res.json({
    success: true,
    currencies: currencies,
    total: currencies.length
  });
});

module.exports = router;
