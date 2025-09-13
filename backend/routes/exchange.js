const express = require('express');
const router = express.Router();
const { getExchangeRates, getAvailableCurrencies } = require('../controllers/exchangeController');

// Obtener todos los tipos de cambio desde una moneda base
// GET /api/exchange/rates?base=USD
router.get('/rates', getExchangeRates);

// Obtener todas las divisas disponibles en Frankfurter
// GET /api/exchange/currencies
router.get('/currencies', getAvailableCurrencies);

module.exports = router;
