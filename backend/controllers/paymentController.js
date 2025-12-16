const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { amount, bookingId } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `booking_${bookingId}_${Date.now()}`,
      notes: {
        bookingId: bookingId,
        userId: req.user.id
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    // Create signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    // Verify signature
    if (razorpay_signature === expectedSign) {
      // Update booking payment status
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      booking.paymentStatus = 'completed';
      booking.paymentMethod = 'razorpay';
      booking.paymentDetails = {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature
      };
      await booking.save();

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        booking
      });
    } else {
      // Payment failed
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.paymentStatus = 'failed';
        await booking.save();
      }

      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment verification error',
      error: error.message
    });
  }
};

// @desc    Process refund
// @route   POST /api/payment/refund/:bookingId
// @access  Private
exports.processRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if booking is cancelled and eligible for refund
    if (booking.bookingStatus !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled bookings are eligible for refund'
      });
    }

    if (!booking.paymentDetails || !booking.paymentDetails.paymentId) {
      return res.status(400).json({
        success: false,
        message: 'No payment found for this booking'
      });
    }

    // Create refund
    const refund = await razorpay.payments.refund(
      booking.paymentDetails.paymentId,
      {
        amount: booking.cancellation.refundAmount * 100, // amount in paise
        speed: 'normal',
        notes: {
          bookingId: booking._id.toString(),
          reason: 'Booking cancelled by user'
        }
      }
    );

    // Update refund status
    booking.cancellation.refundStatus = 'processed';
    booking.cancellation.refundDetails = {
      refundId: refund.id,
      refundAmount: refund.amount / 100,
      processedAt: new Date()
    };
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      refund
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Refund processing failed',
      error: error.message
    });
  }
};