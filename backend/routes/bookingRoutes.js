const express = require('express');
const router = express.Router();
const {
  createBooking,
  confirmBooking, // ✅ ADD THIS
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  getBookingStats,
  downloadTicket
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// User routes
router.post('/', createBooking);
router.post('/:id/confirm', confirmBooking); // ✅ ADD THIS LINE
router.get('/my-bookings', getMyBookings);
router.get('/:id', getBookingById);
router.get('/:id/download', downloadTicket);
router.get('/:id/ticket-html', async (req, res) => {
  // ... rest of your code stays same
});
router.put('/:id/cancel', cancelBooking);

// Admin routes
router.get('/admin/all', authorize('admin'), getAllBookings);
router.get('/admin/stats', authorize('admin'), getBookingStats);

module.exports = router;