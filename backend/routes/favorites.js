const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const {
  addFavorite,
  getFavorites,
  deleteFavorite,
  updateFavorite
} = require('../controllers/favoriteController');

// Todas las rutas requieren autenticación
router.use(requireAuth);

// Añadir un par a favoritos
router.post('/', addFavorite);

// Listar favoritos del usuario
router.get('/', getFavorites);

// Actualizar nickname de un favorito
router.put('/:id', updateFavorite);

// Eliminar un favorito
router.delete('/:id', deleteFavorite);

module.exports = router;
