const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please provide offer code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Please provide offer title']
  },
  description: {
    type: String,
    required: [true, 'Please provide offer description']
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: [true, 'Please provide discount value'],
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: null // For percentage discounts
  },
  minBookingAmount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    required: true
  },
  validTill: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  userUsageLimit: {
    type: Number,
    default: 1 // How many times one user can use
  },
  applicableRoutes: [{
    from: String,
    to: String
  }],
  applicableBuses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  termsAndConditions: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to check if offer is valid
offerSchema.methods.isValid = function() {
  const now = new Date();
  
  // Check if active
  if (!this.isActive) return { valid: false, message: 'Offer is not active' };
  
  // Check date validity
  if (now < this.validFrom) return { valid: false, message: 'Offer not started yet' };
  if (now > this.validTill) return { valid: false, message: 'Offer has expired' };
  
  // Check usage limit
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Offer usage limit reached' };
  }
  
  return { valid: true, message: 'Offer is valid' };
};

// Method to calculate discount
offerSchema.methods.calculateDiscount = function(bookingAmount) {
  if (bookingAmount < this.minBookingAmount) {
    return {
      applicable: false,
      message: `Minimum booking amount is ₹${this.minBookingAmount}`,
      discount: 0
    };
  }

  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (bookingAmount * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;
  }

  return {
    applicable: true,
    discount: Math.round(discount),
    finalAmount: bookingAmount - Math.round(discount)
  };
};

module.exports = mongoose.model('Offer', offerSchema);