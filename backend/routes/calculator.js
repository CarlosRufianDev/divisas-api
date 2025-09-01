const express = require('express');
const router = express.Router();
const {
  multipleConversion,
  reverseConversion,
  comparePairs,
  historicalRate,
  technicalAnalysis,
  getTrendingRates
} = require('../controllers/calculatorController');

router.post('/multiple', multipleConversion);
router.post('/reverse', reverseConversion);
router.post('/compare', comparePairs);
router.post('/historical', historicalRate);
router.post('/technical-analysis', technicalAnalysis);
router.get('/trending-rates', getTrendingRates);

module.exports = router;
