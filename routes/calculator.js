const express = require('express');
const router = express.Router();
const { multipleConversion, reverseConversion, comparePairs, historicalRate } = require('../controllers/calculatorController');

router.post('/multiple', multipleConversion);
router.post('/reverse', reverseConversion);
router.post('/compare', comparePairs);
router.post('/historical', historicalRate);

module.exports = router;