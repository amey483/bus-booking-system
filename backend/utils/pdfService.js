const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateTicketPDF = async (booking) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'tickets');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // File path
      const fileName = `ticket_${booking.bookingId}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      // Pipe the PDF to a file
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Header with gradient background
      doc.rect(0, 0, doc.page.width, 120).fill('#3b82f6');

      // Company logo/name
      doc.fontSize(32)
        .fillColor('white')
        .text('BusBooking', 50, 40, { align: 'left' });

      doc.fontSize(14)
        .text('Your Travel Partner', 50, 75);

      // Ticket title
      doc.fontSize(20)
        .fillColor('#1e3a8a')
        .text('E-TICKET', 50, 140);

      // Booking ID and Status
      doc.fontSize(12)
        .fillColor('#666')
        .text(`Booking ID: ${booking.bookingId}`, 50, 170);

      // Status badge
      const status = booking.bookingStatus === 'confirmed' ? 'CONFIRMED' : 'CANCELLED';
      const statusColor = booking.bookingStatus === 'confirmed' ? '#10b981' : '#ef4444';
      
      doc.rect(450, 165, 100, 25)
        .fill(statusColor);
      
      doc.fontSize(12)
        .fillColor('white')
        .text(status, 455, 171, { width: 90, align: 'center' });

      // Journey Details Box
      doc.rect(50, 210, 495, 100)
        .stroke('#e5e7eb');

      doc.fontSize(16)
        .fillColor('#1f2937')
        .text('Journey Details', 60, 220);

      doc.fontSize(12)
        .fillColor('#666')
        .text('From:', 60, 250)
        .fillColor('#1f2937')
        .text(booking.bus.from, 120, 250);

      doc.fillColor('#666')
        .text('To:', 60, 275)
        .fillColor('#1f2937')
        .text(booking.bus.to, 120, 275);

      doc.fillColor('#666')
        .text('Date:', 300, 250)
        .fillColor('#1f2937')
        .text(new Date(booking.journeyDate).toLocaleDateString('en-IN'), 360, 250);

      doc.fillColor('#666')
        .text('Time:', 300, 275)
        .fillColor('#1f2937')
        .text(booking.bus.departureTime, 360, 275);

      // Bus Details Box
      doc.rect(50, 330, 495, 100)
        .stroke('#e5e7eb');

      doc.fontSize(16)
        .fillColor('#1f2937')
        .text('Bus Details', 60, 340);

      doc.fontSize(12)
        .fillColor('#666')
        .text('Bus Name:', 60, 370)
        .fillColor('#1f2937')
        .text(booking.bus.busName, 150, 370);

      doc.fillColor('#666')
        .text('Bus Number:', 60, 395)
        .fillColor('#1f2937')
        .text(booking.bus.busNumber, 150, 395);

      doc.fillColor('#666')
        .text('Seats:', 300, 370)
        .fillColor('#1f2937')
        .text(booking.seats.join(', '), 360, 370);

      // Passenger Details Box
      doc.rect(50, 450, 495, 120)
        .stroke('#e5e7eb');

      doc.fontSize(16)
        .fillColor('#1f2937')
        .text('Passenger Details', 60, 460);

      doc.fontSize(12)
        .fillColor('#666')
        .text('Name:', 60, 490)
        .fillColor('#1f2937')
        .text(booking.passengerDetails.name, 150, 490);

      doc.fillColor('#666')
        .text('Age:', 60, 515)
        .fillColor('#1f2937')
        .text(booking.passengerDetails.age.toString(), 150, 515);

      doc.fillColor('#666')
        .text('Gender:', 60, 540)
        .fillColor('#1f2937')
        .text(booking.passengerDetails.gender, 150, 540);

      doc.fillColor('#666')
        .text('Phone:', 300, 490)
        .fillColor('#1f2937')
        .text(booking.passengerDetails.phone, 360, 490);

      // Boarding & Dropping Points
      doc.fillColor('#666')
        .text('Boarding:', 300, 515)
        .fillColor('#1f2937')
        .text(booking.boardingPoint, 360, 515, { width: 180 });

      doc.fillColor('#666')
        .text('Dropping:', 300, 540)
        .fillColor('#1f2937')
        .text(booking.droppingPoint, 360, 540, { width: 180 });

      // Payment Details Box
      doc.rect(50, 590, 495, 70)
        .stroke('#e5e7eb');

      doc.fontSize(16)
        .fillColor('#1f2937')
        .text('Payment Details', 60, 600);

      doc.fontSize(12)
        .fillColor('#666')
        .text('Total Amount:', 60, 630)
        .fontSize(18)
        .fillColor('#10b981')
        .text(`₹${booking.totalAmount}`, 180, 627);

      doc.fontSize(12)
        .fillColor('#666')
        .text('Payment Status:', 300, 630)
        .fillColor(booking.paymentStatus === 'completed' ? '#10b981' : '#f59e0b')
        .text(booking.paymentStatus.toUpperCase(), 420, 630);

      // Instructions
      doc.fontSize(10)
        .fillColor('#666')
        .text('Important Instructions:', 50, 680);

      const instructions = [
        '• Please arrive at the boarding point 15 minutes before departure',
        '• Carry a valid ID proof during your journey',
        '• This is a computer-generated ticket and does not require a signature',
        '• Contact support for any queries: support@busbooking.com'
      ];

      let yPos = 700;
      instructions.forEach(instruction => {
        doc.text(instruction, 50, yPos);
        yPos += 15;
      });

      // Footer
      doc.fontSize(10)
        .fillColor('#999')
        .text(
          `Generated on: ${new Date().toLocaleString('en-IN')}`,
          50,
          doc.page.height - 50,
          { align: 'center', width: doc.page.width - 100 }
        );

      // Finalize the PDF
      doc.end();

      // Wait for file to be written
      writeStream.on('finish', () => {
        resolve(filePath);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};