const express = require('express');
const router = express.Router();
const { convertCurrency } = require('../controllers/convertController');

router.post('/', convertCurrency);

module.exports = router;
