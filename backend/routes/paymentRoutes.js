const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  processRefund
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/refund/:bookingId', processRefund);

module.exports = router;