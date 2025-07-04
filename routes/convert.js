const express = require('express');
const router = express.Router();
const { convertCurrency, getHistory } = require('../controllers/convertController');

// POST para convertir
router.post('/convert', convertCurrency);

// GET para historial
router.get('/historial', getHistory);

module.exports = router;

