const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Bus = require('../models/Bus');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment, categories } = req.body;

    // Check if booking exists and belongs to user
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
        message: 'Not authorized to review this booking'
      });
    }

    // Check if booking is completed
    if (booking.bookingStatus !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Check if journey date has passed
    const journeyDate = new Date(booking.journeyDate);
    const currentDate = new Date();
    if (journeyDate > currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot review before journey date'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      user: req.user.id,
      booking: bookingId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking'
      });
    }

    // Create review
    const review = await Review.create({
      user: req.user.id,
      bus: booking.bus,
      booking: bookingId,
      rating,
      comment,
      categories: categories || {},
      isVerified: true
    });

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name')
      .populate('bus', 'busName busNumber');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review: populatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
};

// @desc    Get reviews for a bus
// @route   GET /api/reviews/bus/:busId
// @access  Public
exports.getBusReviews = async (req, res) => {
  try {
    const { busId } = req.params;
    const { sort = '-createdAt', limit = 10, page = 1 } = req.query;

    const reviews = await Review.find({ bus: busId })
      .populate('user', 'name')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Review.countDocuments({ bus: busId });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('bus', 'busName busNumber from to')
      .populate('booking', 'bookingId journeyDate')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    const { rating, comment, categories } = req.body;

    review = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, comment, categories },
      { new: true, runValidators: true }
    ).populate('user', 'name').populate('bus', 'busName busNumber');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership or admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await review.remove();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

// @desc    Admin response to review
// @route   PUT /api/reviews/:id/response
// @access  Private/Admin
exports.respondToReview = async (req, res) => {
  try {
    const { comment } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        adminResponse: {
          comment,
          respondedAt: new Date()
        }
      },
      { new: true }
    ).populate('user', 'name').populate('bus', 'busName busNumber');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add response',
      error: error.message
    });
  }
};

// @desc    Check if user can review booking
// @route   GET /api/reviews/can-review/:bookingId
// @access  Private
exports.canReviewBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        canReview: false,
        message: 'Not your booking'
      });
    }

    // Check if journey has completed
    const journeyDate = new Date(booking.journeyDate);
    const currentDate = new Date();
    
    if (journeyDate > currentDate) {
      return res.status(200).json({
        success: true,
        canReview: false,
        message: 'Journey not completed yet'
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      user: req.user.id,
      booking: req.params.bookingId
    });

    if (existingReview) {
      return res.status(200).json({
        success: true,
        canReview: false,
        message: 'Already reviewed',
        review: existingReview
      });
    }

    res.status(200).json({
      success: true,
      canReview: true,
      message: 'Can review this booking'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check review eligibility',
      error: error.message
    });
  }
};