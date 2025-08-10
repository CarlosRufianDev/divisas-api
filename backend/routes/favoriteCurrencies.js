const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const {
  addFavoriteCurrency,
  getFavoriteCurrencies,
  deleteFavoriteCurrency,
  updateFavoriteCurrency,
  getFavoriteCurrenciesForDropdown
} = require('../controllers/favoriteCurrencyController');

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Añadir una moneda a favoritas
router.post('/', addFavoriteCurrency);

// Listar monedas favoritas del usuario (con tipos de cambio)
router.get('/', getFavoriteCurrencies);

// Obtener lista simplificada para dropdowns
router.get('/dropdown', getFavoriteCurrenciesForDropdown);

// Actualizar una moneda favorita (nickname, priority, isDefault)
router.put('/:id', updateFavoriteCurrency);

// Eliminar una moneda favorita
router.delete('/:id', deleteFavoriteCurrency);

module.exports = router;
