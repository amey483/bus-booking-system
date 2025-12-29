const axios = require('axios');
const crypto = require('crypto');
const Booking = require('../models/Booking');

console.log('🔧 Loading Payment Controller...');
console.log('Environment variables:');
console.log('  RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('  RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing');

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  console.log('\n💳 ===== CREATE ORDER REQUEST =====');
  
  try {
    const { amount, bookingId } = req.body;

    console.log('Request:', { amount, bookingId });

    // Validate
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Check booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Generate receipt
    const shortId = bookingId.toString().slice(-12);
    const timestamp = Date.now().toString(36).toUpperCase();
    const receipt = `BK${shortId}${timestamp}`.substring(0, 40);

    // Order data
    const orderData = {
      amount: Math.round(amount * 100), // Paise
      currency: 'INR',
      receipt: receipt,
      notes: {
        bookingId: bookingId,
        userId: req.user.id,
        bookingIdDisplay: booking.bookingId
      }
    };

    console.log('📋 Creating Razorpay order:', orderData);

    // ✅ DIRECT API CALL using axios
    const response = await axios.post(
      'https://api.razorpay.com/v1/orders',
      orderData,
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const order = response.data;
    console.log('✅ Order created successfully:', order.id);

    res.status(200).json({
      success: true,
      order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('\n❌ ===== PAYMENT ERROR =====');
    console.error('Error:', error.response?.data || error.message);
    
    // Handle Razorpay API errors
    if (error.response?.data?.error) {
      const razorpayError = error.response.data.error;
      console.error('Razorpay Error:', razorpayError);
      
      return res.status(error.response.status || 500).json({
        success: false,
        message: razorpayError.description || 'Payment order creation failed',
        error: razorpayError.description
      });
    }

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

    console.log('🔍 Verifying payment:', {
      razorpay_order_id,
      razorpay_payment_id,
      bookingId
    });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment details'
      });
    }

    // Create signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    console.log('Signature match:', razorpay_signature === expectedSign);

    // Verify signature
    if (razorpay_signature === expectedSign) {
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (booking.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }

      // Update booking
      booking.paymentStatus = 'completed';
      booking.paymentMethod = 'razorpay';
      booking.paymentDetails = {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature
      };
      booking.bookingStatus = 'confirmed';
      await booking.save();

      console.log('✅ Payment verified and booking confirmed');

      // Send email
      try {
        const { sendBookingConfirmation } = require('../utils/emailService');
        const populatedBooking = await Booking.findById(booking._id)
          .populate('user', 'name email phone')
          .populate('bus', 'busName busNumber from to departureTime arrivalTime');
        
        await sendBookingConfirmation(populatedBooking, req.user);
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        booking
      });
    } else {
      // Failed verification
      console.error('❌ Signature mismatch');
      
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.paymentStatus = 'failed';
        booking.bookingStatus = 'cancelled';
        await booking.save();
      }

      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
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

    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

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

    console.log('💰 Processing refund...');

    // Direct API call for refund
    const refundData = {
      amount: Math.round(booking.cancellation.refundAmount * 100),
      speed: 'normal',
      notes: {
        bookingId: booking._id.toString(),
        reason: 'Booking cancelled by user'
      }
    };

    const response = await axios.post(
      `https://api.razorpay.com/v1/payments/${booking.paymentDetails.paymentId}/refund`,
      refundData,
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const refund = response.data;

    booking.cancellation.refundStatus = 'processed';
    booking.cancellation.refundDetails = {
      refundId: refund.id,
      refundAmount: refund.amount / 100,
      processedAt: new Date()
    };
    await booking.save();

    console.log('✅ Refund processed:', refund.id);

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      refund
    });
  } catch (error) {
    console.error('❌ Refund error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed',
      error: error.response?.data?.error?.description || error.message
    });
  }
};