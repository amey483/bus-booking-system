const express = require('express');
const router = express.Router();
const {
  createReview,
  getBusReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  respondToReview,
  canReviewBooking
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/bus/:busId', getBusReviews);

// Protected routes
router.use(protect);
router.post('/', createReview);
router.get('/my-reviews', getMyReviews);
router.get('/can-review/:bookingId', canReviewBooking);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

// Admin routes
router.put('/:id/response', authorize('admin'), respondToReview);

module.exports = router;