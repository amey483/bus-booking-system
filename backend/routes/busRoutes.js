const express = require('express');
const router = express.Router();
const {
  createBus,
  getAllBuses,
  searchBuses,
  getBusById,
  updateBus,
  deleteBus,
  getBusSeats,
  getAllRoutes
} = require('../controllers/busController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllBuses);
router.get('/search', searchBuses);
router.get('/routes/all', getAllRoutes);
router.get('/:id', getBusById);
router.get('/:id/seats', getBusSeats);

// Protected routes - Admin only
router.post('/', protect, authorize('admin'), createBus);
router.put('/:id', protect, authorize('admin'), updateBus);
router.delete('/:id', protect, authorize('admin'), deleteBus);

module.exports = router;