const Booking = require('../models/Booking');
const Bus = require('../models/Bus');
const { sendBookingConfirmation, sendCancellationEmail } = require('../utils/emailService');
const { generateTicketPDF } = require('../utils/pdfService');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const {
      busId,
      passengerDetails,
      seats,
      journeyDate,
      boardingPoint,
      droppingPoint,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!busId || !passengerDetails || !seats || !journeyDate || !boardingPoint || !droppingPoint) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required booking details'
      });
    }

    // Check if bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    // Check if bus is active
    if (bus.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This bus is currently not available for booking'
      });
    }

    // Validate seats
    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one seat'
      });
    }

    // Check if seats are available
    for (let seatNumber of seats) {
      const seat = bus.seatLayout.find(s => s.seatNumber === seatNumber);
      
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatNumber} does not exist. Available seats: ${bus.seatLayout.map(s => s.seatNumber).join(', ')}`
        });
      }

      if (seat.isBooked) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatNumber} is already booked`
        });
      }
    }

    // Calculate total amount
    const totalAmount = bus.price * seats.length;

    // Generate booking ID manually to ensure it's created
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomStr = Math.random().toString(36).substr(2, 5).toUpperCase();
    const bookingId = `BKG${timestamp}${randomStr}`;

    // Create booking
    const booking = await Booking.create({
      bookingId,
      user: req.user.id,
      bus: busId,
      passengerDetails,
      seats,
      journeyDate,
      boardingPoint,
      droppingPoint,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'completed'
    });

    // Update bus seats
    for (let seatNumber of seats) {
      const seatIndex = bus.seatLayout.findIndex(s => s.seatNumber === seatNumber);
      bus.seatLayout[seatIndex].isBooked = true;
      bus.seatLayout[seatIndex].bookedBy = req.user.id;
    }
    
    bus.updateAvailableSeats();
    await bus.save();

    // Populate booking details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email phone')
      .populate('bus', 'busName busNumber from to departureTime arrivalTime');

    // Send booking confirmation email
    try {
      console.log('Sending confirmation email to:', req.user.email);
      await sendBookingConfirmation(populatedBooking, req.user);
      console.log('✅ Confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError.message);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Booking failed',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get all bookings for logged in user
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('bus', 'busName busNumber from to departureTime arrivalTime')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('bus', 'busName busNumber from to departureTime arrivalTime duration price');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking or is admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('bus');

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
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking is already cancelled
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Check if journey date has passed
    const journeyDate = new Date(booking.journeyDate);
    const currentDate = new Date();
    
    if (journeyDate < currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel booking for past dates'
      });
    }

    // Get cancellation reason from request body
    const cancellationReason = req.body.reason || 'User cancelled';

    // Cancel the booking
    await booking.cancelBooking(cancellationReason);

    // Free up the seats in the bus
    const bus = booking.bus;
    for (let seatNumber of booking.seats) {
      const seatIndex = bus.seatLayout.findIndex(s => s.seatNumber === seatNumber);
      if (seatIndex !== -1) {
        bus.seatLayout[seatIndex].isBooked = false;
        bus.seatLayout[seatIndex].bookedBy = null;
      }
    }
    
    bus.updateAvailableSeats();
    await bus.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email phone')
      .populate('bus', 'busName busNumber from to');

    // Send cancellation email
    try {
      console.log('Sending cancellation email to:', req.user.email);
      await sendCancellationEmail(updatedBooking, req.user);
      console.log('✅ Cancellation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cancellation failed',
      error: error.message
    });
  }
};

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings/admin/all
// @access  Private/Admin
exports.getAllBookings = async (req, res) => {
  try {
    const { status, busId, fromDate, toDate } = req.query;
    
    let query = {};
    
    if (status) query.bookingStatus = status;
    if (busId) query.bus = busId;
    if (fromDate || toDate) {
      query.journeyDate = {};
      if (fromDate) query.journeyDate.$gte = new Date(fromDate);
      if (toDate) query.journeyDate.$lte = new Date(toDate);
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('bus', 'busName busNumber from to')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// @desc    Get booking statistics (Admin only)
// @route   GET /api/bookings/admin/stats
// @access  Private/Admin
exports.getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ bookingStatus: 'confirmed' });
    const cancelledBookings = await Booking.countDocuments({ bookingStatus: 'cancelled' });
    
    // Calculate revenue from confirmed bookings only
    const revenue = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Calculate total refunds from cancelled bookings
    const refunds = await Booking.aggregate([
      { $match: { bookingStatus: 'cancelled', 'cancellation.isCancelled': true } },
      { $group: { _id: null, total: { $sum: '$cancellation.refundAmount' } } }
    ]);

    const stats = {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      totalRevenue: revenue.length > 0 ? revenue[0].total : 0,
      totalRefunds: refunds.length > 0 ? refunds[0].total : 0
    };

    console.log('Admin stats:', stats); // Debug log

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// @desc    Download ticket PDF
// @route   GET /api/bookings/:id/download
// @access  Private
exports.downloadTicket = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('bus', 'busName busNumber from to departureTime arrivalTime');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking or is admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this ticket'
      });
    }

    // Check if booking is confirmed
    if (booking.bookingStatus !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot download ticket for cancelled bookings'
      });
    }

    console.log('Generating PDF for booking:', booking.bookingId);

    // Check if PDF service exists
    let pdfPath;
    try {
      const { generateTicketPDF } = require('../utils/pdfService');
      pdfPath = await generateTicketPDF(booking);
      console.log('PDF generated at:', pdfPath);
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      return res.status(500).json({
        success: false,
        message: 'PDF generation failed. PDFKit may not be installed.',
        error: pdfError.message
      });
    }

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(pdfPath)) {
      return res.status(500).json({
        success: false,
        message: 'PDF file was not created'
      });
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket_${booking.bookingId}.pdf`);

    // Send file
    res.sendFile(pdfPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Failed to send ticket file'
          });
        }
      } else {
        console.log('✅ PDF sent successfully');
        // Optional: Delete file after sending
        // fs.unlinkSync(pdfPath);
      }
    });
  } catch (error) {
    console.error('Download ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate ticket',
      error: error.message
    });
  }
};