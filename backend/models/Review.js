const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Please provide a comment'],
    maxlength: 500
  },
  categories: {
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    comfort: {
      type: Number,
      min: 1,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    staff: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  adminResponse: {
    comment: String,
    respondedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index to prevent duplicate reviews
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });

// Static method to calculate average rating for a bus
reviewSchema.statics.calculateAverageRating = async function(busId) {
  const stats = await this.aggregate([
    { $match: { bus: busId } },
    {
      $group: {
        _id: '$bus',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        averageCleanliness: { $avg: '$categories.cleanliness' },
        averageComfort: { $avg: '$categories.comfort' },
        averagePunctuality: { $avg: '$categories.punctuality' },
        averageStaff: { $avg: '$categories.staff' }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Bus').findByIdAndUpdate(busId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
      ratingBreakdown: {
        cleanliness: Math.round(stats[0].averageCleanliness * 10) / 10,
        comfort: Math.round(stats[0].averageComfort * 10) / 10,
        punctuality: Math.round(stats[0].averagePunctuality * 10) / 10,
        staff: Math.round(stats[0].averageStaff * 10) / 10
      }
    });
  }
};

// Update average rating after save
reviewSchema.post('save', async function() {
  await this.constructor.calculateAverageRating(this.bus);
});

// Update average rating after remove
reviewSchema.post('remove', async function() {
  await this.constructor.calculateAverageRating(this.bus);
});

module.exports = mongoose.model('Review', reviewSchema);