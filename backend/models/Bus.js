const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busName: {
    type: String,
    required: [true, 'Please provide bus name'],
    trim: true
  },
  busNumber: {
    type: String,
    required: [true, 'Please provide bus number'],
    unique: true,
    uppercase: true,
    trim: true
  },
  busType: {
    type: String,
    enum: ['AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper', 'Luxury'],
    required: [true, 'Please specify bus type']
  },
  from: {
    type: String,
    required: [true, 'Please provide starting location'],
    trim: true
  },
  to: {
    type: String,
    required: [true, 'Please provide destination'],
    trim: true
  },
  departureTime: {
    type: String,
    required: [true, 'Please provide departure time']
  },
  arrivalTime: {
    type: String,
    required: [true, 'Please provide arrival time']
  },
  duration: {
    type: String,
    required: [true, 'Please provide journey duration']
  },
  price: {
    type: Number,
    required: [true, 'Please provide ticket price'],
    min: 0
  },
  totalSeats: {
    type: Number,
    required: [true, 'Please provide total seats'],
    default: 40
  },
  availableSeats: {
    type: Number
  },
  seatLayout: [{
    seatNumber: {
      type: String,
      required: true
    },
    isBooked: {
      type: Boolean,
      default: false
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }],
  amenities: [{
    type: String,
    enum: ['WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Pillow', 'Snacks', 'TV', 'Reading Light']
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  operatingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  ratingBreakdown: {
    cleanliness: { type: Number, default: 0 },
    comfort: { type: Number, default: 0 },
    punctuality: { type: Number, default: 0 },
    staff: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Initialize seat layout when creating a new bus
busSchema.pre('save', function(next) {
  if (this.isNew) {
    // Create seat layout if it doesn't exist
    if (!this.seatLayout || this.seatLayout.length === 0) {
      const seats = [];
      for (let i = 1; i <= this.totalSeats; i++) {
        seats.push({
          seatNumber: `S${i}`,
          isBooked: false,
          bookedBy: null
        });
      }
      this.seatLayout = seats;
    }
    
    // Set available seats equal to total seats initially
    if (!this.availableSeats) {
      this.availableSeats = this.totalSeats;
    }
  }
  next();
});

// Method to calculate available seats
busSchema.methods.updateAvailableSeats = function() {
  const bookedSeats = this.seatLayout.filter(seat => seat.isBooked).length;
  this.availableSeats = this.totalSeats - bookedSeats;
};

module.exports = mongoose.model('Bus', busSchema);