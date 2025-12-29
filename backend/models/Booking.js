const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: [true, 'Bus is required']
  },
  passengerDetails: {
    name: {
      type: String,
      required: [true, 'Passenger name is required']
    },
    age: {
      type: Number,
      required: [true, 'Passenger age is required'],
      min: 1,
      max: 120
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Gender is required']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    }
  },
  seats: [{
    type: String,
    required: true
  }],
  journeyDate: {
    type: Date,
    required: [true, 'Journey date is required']
  },
  boardingPoint: {
    type: String,
    required: true
  },
  droppingPoint: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: 0
  },
  offerApplied: {
    code: String,
    discount: Number,
    originalAmount: Number
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'wallet', 'razorpay', 'online'], // ✅ FIXED: Added 'online' and 'razorpay'
    default: 'cash'
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  paymentDetails: {
    orderId: String,
    paymentId: String,
    signature: String
  },
  cancellation: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'completed', 'failed'],
      default: 'pending'
    },
    refundDetails: {
      refundId: String,
      refundAmount: Number,
      processedAt: Date
    }
  },
  bookingDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique booking ID before saving
bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.bookingId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.bookingId = `BKG${timestamp}${randomStr}`;
  }
  next();
});

// Method to cancel booking
bookingSchema.methods.cancelBooking = function(reason = 'User cancelled') {
  this.bookingStatus = 'cancelled';
  this.cancellation.isCancelled = true;
  this.cancellation.cancelledAt = new Date();
  this.cancellation.cancellationReason = reason;
  
  // Calculate refund (80% of total amount)
  this.cancellation.refundAmount = this.totalAmount * 0.8;
  this.cancellation.refundStatus = 'pending';
  
  return this.save();
};

module.exports = mongoose.model('Booking', bookingSchema);