const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createProvider,
  getAllProviders,
  getProviderById,
  updateProvider,
  deleteProvider
} = require('../controllers/providerController');

router.post('/', protect, createProvider);
router.get('/', getAllProviders);
router.get('/:id', getProviderById);
router.put('/:id', protect, updateProvider);
router.delete('/:id', protect, deleteProvider);

module.exports = router;