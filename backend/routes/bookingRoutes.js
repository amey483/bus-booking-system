const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  getBookingStats,
  downloadTicket
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// User routes
router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);
router.get('/:id', getBookingById);
router.get('/:id/download', downloadTicket);
router.get('/:id/ticket-html', async (req, res) => {
  // Simple HTML ticket for browser printing
  try {
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('bus', 'busName busNumber from to departureTime arrivalTime');
    
    if (!booking) {
      return res.status(404).send('Booking not found');
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${booking.bookingId}</title>
        <style>
          body { font-family: Arial; padding: 40px; }
          .ticket { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 30px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .section { margin: 20px 0; }
          .label { font-weight: bold; display: inline-block; width: 150px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>🚌 BusBooking E-Ticket</h1>
            <h3>${booking.bookingStatus === 'confirmed' ? '✅ CONFIRMED' : '❌ CANCELLED'}</h3>
          </div>
          
          <div class="section">
            <h2>Booking Details</h2>
            <p><span class="label">Booking ID:</span> ${booking.bookingId}</p>
            <p><span class="label">Booked On:</span> ${new Date(booking.bookingDate).toLocaleString()}</p>
          </div>

          <div class="section">
            <h2>Journey Details</h2>
            <p><span class="label">Bus Name:</span> ${booking.bus.busName}</p>
            <p><span class="label">Bus Number:</span> ${booking.bus.busNumber}</p>
            <p><span class="label">From:</span> ${booking.bus.from}</p>
            <p><span class="label">To:</span> ${booking.bus.to}</p>
            <p><span class="label">Journey Date:</span> ${new Date(booking.journeyDate).toLocaleDateString()}</p>
            <p><span class="label">Departure:</span> ${booking.bus.departureTime}</p>
            <p><span class="label">Seats:</span> ${booking.seats.join(', ')}</p>
          </div>

          <div class="section">
            <h2>Passenger Details</h2>
            <p><span class="label">Name:</span> ${booking.passengerDetails.name}</p>
            <p><span class="label">Age:</span> ${booking.passengerDetails.age}</p>
            <p><span class="label">Gender:</span> ${booking.passengerDetails.gender}</p>
            <p><span class="label">Phone:</span> ${booking.passengerDetails.phone}</p>
          </div>

          <div class="section">
            <h2>Payment Details</h2>
            <p><span class="label">Total Amount:</span> ₹${booking.totalAmount}</p>
            <p><span class="label">Payment Status:</span> ${booking.paymentStatus}</p>
          </div>

          <div class="section no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
              🖨️ Print Ticket
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">
              Close
            </button>
          </div>
        </div>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    res.status(500).send('Error generating ticket');
  }
});
router.put('/:id/cancel', cancelBooking);

// Admin routes
router.get('/admin/all', authorize('admin'), getAllBookings);
router.get('/admin/stats', authorize('admin'), getBookingStats);

module.exports = router;