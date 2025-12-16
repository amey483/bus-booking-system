const nodemailer = require('nodemailer');

// Create transporter with better configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
});

// Send booking confirmation email
exports.sendBookingConfirmation = async (booking, user) => {
  try {
    const mailOptions = {
      from: `"BusBooking System" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Booking Confirmation - BusBooking',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3b82f6; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed! 🎉</h1>
            </div>
            <div class="content">
              <p>Dear ${booking.passengerDetails.name},</p>
              <p>Your bus ticket has been confirmed successfully. Here are your booking details:</p>
              
              <div class="details">
                <h3>Booking Information</h3>
                <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
                <p><strong>Bus Name:</strong> ${booking.bus.busName}</p>
                <p><strong>Bus Number:</strong> ${booking.bus.busNumber}</p>
                <p><strong>Route:</strong> ${booking.bus.from} → ${booking.bus.to}</p>
                <p><strong>Journey Date:</strong> ${new Date(booking.journeyDate).toLocaleDateString('en-IN')}</p>
                <p><strong>Departure Time:</strong> ${booking.bus.departureTime}</p>
                <p><strong>Seat Numbers:</strong> ${booking.seats.join(', ')}</p>
                <p><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
                <p><strong>Payment Status:</strong> ${booking.paymentStatus}</p>
              </div>

              <div class="details">
                <h3>Passenger Details</h3>
                <p><strong>Name:</strong> ${booking.passengerDetails.name}</p>
                <p><strong>Age:</strong> ${booking.passengerDetails.age}</p>
                <p><strong>Gender:</strong> ${booking.passengerDetails.gender}</p>
                <p><strong>Phone:</strong> ${booking.passengerDetails.phone}</p>
              </div>

              <div class="details">
                <h3>Boarding & Dropping Points</h3>
                <p><strong>Boarding:</strong> ${booking.boardingPoint}</p>
                <p><strong>Dropping:</strong> ${booking.droppingPoint}</p>
              </div>

              <p>Please arrive at the boarding point 15 minutes before departure time.</p>
              
              <p style="text-align: center;">
                <a href="http://localhost:3000/my-bookings" class="button">View My Bookings</a>
              </p>

              <p><strong>Important:</strong> Please carry a valid ID proof during your journey.</p>
            </div>
            <div class="footer">
              <p>Thank you for choosing BusBooking!</p>
              <p>For support, contact us at support@busbooking.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent to:', user.email);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send cancellation email
exports.sendCancellationEmail = async (booking, user) => {
  try {
    const mailOptions = {
      from: `"BusBooking System" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Booking Cancelled - BusBooking',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #ef4444; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Cancelled</h1>
            </div>
            <div class="content">
              <p>Dear ${booking.passengerDetails.name},</p>
              <p>Your booking has been cancelled as requested.</p>
              
              <div class="details">
                <h3>Cancellation Details</h3>
                <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
                <p><strong>Bus:</strong> ${booking.bus.busName}</p>
                <p><strong>Route:</strong> ${booking.bus.from} → ${booking.bus.to}</p>
                <p><strong>Journey Date:</strong> ${new Date(booking.journeyDate).toLocaleDateString('en-IN')}</p>
                <p><strong>Cancelled On:</strong> ${new Date(booking.cancellation.cancelledAt).toLocaleString('en-IN')}</p>
                <p><strong>Original Amount:</strong> ₹${booking.totalAmount}</p>
                <p><strong>Refund Amount:</strong> ₹${booking.cancellation.refundAmount}</p>
                <p><strong>Refund Status:</strong> ${booking.cancellation.refundStatus}</p>
              </div>

              <p>Your refund will be processed within 5-7 business days.</p>
              <p>The refund will be credited to your original payment method.</p>
            </div>
            <div class="footer">
              <p>We hope to serve you again!</p>
              <p>For queries, contact us at support@busbooking.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Cancellation email sent to:', user.email);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send welcome email
exports.sendWelcomeEmail = async (user) => {
  try {
    const mailOptions = {
      from: `"BusBooking System" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Welcome to BusBooking! 🚌',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to BusBooking! 🚌</h1>
            </div>
            <div class="content">
              <p>Dear ${user.name},</p>
              <p>Thank you for registering with BusBooking! We're excited to have you on board.</p>
              
              <p>With BusBooking, you can:</p>
              <ul>
                <li>Search and book bus tickets across India</li>
                <li>Choose your preferred seats</li>
                <li>Track your booking history</li>
                <li>Easy cancellation and refunds</li>
              </ul>

              <p style="text-align: center;">
                <a href="http://localhost:3000" class="button">Start Booking Now</a>
              </p>

              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>Happy Travelling!</p>
              <p>Team BusBooking</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', user.email);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};