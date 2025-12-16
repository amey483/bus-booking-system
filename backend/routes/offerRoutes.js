const express = require('express');
const router = express.Router();
const {
  createOffer,
  getActiveOffers,
  validateOffer,
  getOfferByCode,
  getAllOffers,
  updateOffer,
  deleteOffer
} = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getActiveOffers);
router.get('/:code', getOfferByCode);

// Protected routes
router.post('/validate', protect, validateOffer);

// Admin routes
router.post('/', protect, authorize('admin'), createOffer);
router.get('/admin/all', protect, authorize('admin'), getAllOffers);
router.put('/:id', protect, authorize('admin'), updateOffer);
router.delete('/:id', protect, authorize('admin'), deleteOffer);

module.exports = router;