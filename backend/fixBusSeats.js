const mongoose = require('mongoose');
const Bus = require('./models/Bus');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

const fixBusSeats = async () => {
  try {
    const buses = await Bus.find();
    console.log(`Found ${buses.length} buses`);

    for (let bus of buses) {
      // Check if seat layout exists
      if (!bus.seatLayout || bus.seatLayout.length === 0) {
        console.log(`Fixing seats for: ${bus.busName}`);
        
        // Create seat layout
        const seats = [];
        for (let i = 1; i <= bus.totalSeats; i++) {
          seats.push({
            seatNumber: `S${i}`,
            isBooked: false,
            bookedBy: null
          });
        }
        
        bus.seatLayout = seats;
        bus.availableSeats = bus.totalSeats;
        await bus.save();
        
        console.log(`✅ Fixed ${bus.busName} - Added ${seats.length} seats`);
      } else {
        console.log(`✓ ${bus.busName} already has ${bus.seatLayout.length} seats`);
      }
    }

    console.log('\n✅ All buses checked and fixed!');
    process.exit();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

fixBusSeats();