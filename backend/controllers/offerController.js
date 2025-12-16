const Offer = require('../models/Offer');
const Booking = require('../models/Booking');

// @desc    Create offer (Admin only)
// @route   POST /api/offers
// @access  Private/Admin
exports.createOffer = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const offer = await Offer.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create offer',
      error: error.message
    });
  }
};

// @desc    Get all active offers
// @route   GET /api/offers
// @access  Public
exports.getActiveOffers = async (req, res) => {
  try {
    const now = new Date();
    
    const offers = await Offer.find({
      isActive: true,
      validFrom: { $lte: now },
      validTill: { $gte: now }
    }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offers',
      error: error.message
    });
  }
};

// @desc    Validate and apply offer code
// @route   POST /api/offers/validate
// @access  Private
exports.validateOffer = async (req, res) => {
  try {
    const { code, bookingAmount, busId, route } = req.body;

    // Find offer
    const offer = await Offer.findOne({ code: code.toUpperCase() });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid offer code'
      });
    }

    // Check if offer is valid
    const validityCheck = offer.isValid();
    if (!validityCheck.valid) {
      return res.status(400).json({
        success: false,
        message: validityCheck.message
      });
    }

    // Check user usage limit
    const userUsageCount = await Booking.countDocuments({
      user: req.user.id,
      'offerApplied.code': code.toUpperCase(),
      bookingStatus: 'confirmed'
    });

    if (userUsageCount >= offer.userUsageLimit) {
      return res.status(400).json({
        success: false,
        message: 'You have already used this offer maximum times'
      });
    }

    // Check route applicability
    if (offer.applicableRoutes.length > 0) {
      const isRouteApplicable = offer.applicableRoutes.some(
        r => r.from === route.from && r.to === route.to
      );
      if (!isRouteApplicable) {
        return res.status(400).json({
          success: false,
          message: 'Offer not applicable for this route'
        });
      }
    }

    // Check bus applicability
    if (offer.applicableBuses.length > 0) {
      const isBusApplicable = offer.applicableBuses.some(
        b => b.toString() === busId
      );
      if (!isBusApplicable) {
        return res.status(400).json({
          success: false,
          message: 'Offer not applicable for this bus'
        });
      }
    }

    // Calculate discount
    const discountResult = offer.calculateDiscount(bookingAmount);

    if (!discountResult.applicable) {
      return res.status(400).json({
        success: false,
        message: discountResult.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer applied successfully',
      offer: {
        code: offer.code,
        title: offer.title,
        discountType: offer.discountType,
        discountValue: offer.discountValue
      },
      discount: discountResult.discount,
      originalAmount: bookingAmount,
      finalAmount: discountResult.finalAmount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate offer',
      error: error.message
    });
  }
};

// @desc    Get offer by code
// @route   GET /api/offers/:code
// @access  Public
exports.getOfferByCode = async (req, res) => {
  try {
    const offer = await Offer.findOne({ 
      code: req.params.code.toUpperCase(),
      isActive: true
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.status(200).json({
      success: true,
      offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offer',
      error: error.message
    });
  }
};

// @desc    Get all offers (Admin)
// @route   GET /api/offers/admin/all
// @access  Private/Admin
exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort('-createdAt');

    res.status(200).json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offers',
      error: error.message
    });
  }
};

// @desc    Update offer (Admin)
// @route   PUT /api/offers/:id
// @access  Private/Admin
exports.updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer updated successfully',
      offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update offer',
      error: error.message
    });
  }
};

// @desc    Delete offer (Admin)
// @route   DELETE /api/offers/:id
// @access  Private/Admin
exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete offer',
      error: error.message
    });
  }
};