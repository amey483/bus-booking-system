const mongoose = require('mongoose');
const Bus = require('./models/Bus');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// ✔ Updated sample buses with required fields
const sampleBuses = [
  {
    busName: 'Volvo Express',
    busNumber: 'MH12AB1234',
    busType: 'AC',                    // REQUIRED
    from: 'Mumbai',
    to: 'Pune',
    departureTime: '08:00',
    arrivalTime: '11:30',
    duration: '3h 30m',               // REQUIRED
    price: 500,                       // REQUIRED
    totalSeats: 40,
    amenities: ['WiFi', 'Charging Point', 'Water Bottle'],
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    status: 'active'
  },
  {
    busName: 'Shivneri Deluxe',
    busNumber: 'MH14CD5678',
    busType: 'Non-AC',                // REQUIRED
    from: 'Pune',
    to: 'Mumbai',
    departureTime: '14:00',
    arrivalTime: '17:30',
    duration: '3h 30m',               // REQUIRED
    price: 350,                       // REQUIRED
    totalSeats: 40,
    amenities: ['Water Bottle', 'Reading Light'],
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    status: 'active'
  },
  {
    busName: 'Luxury Sleeper',
    busNumber: 'MH02EF9012',
    busType: 'Sleeper',               // REQUIRED
    from: 'Mumbai',
    to: 'Bangalore',
    departureTime: '20:00',
    arrivalTime: '08:00',
    duration: '12h',                  // REQUIRED
    price: 1200,                      // REQUIRED
    totalSeats: 40,
    amenities: ['WiFi', 'Charging Point', 'Blanket', 'Pillow', 'Water Bottle'],
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    status: 'active'
  },
  {
    busName: 'Express Metro',
    busNumber: 'DL05GH3456',
    busType: 'AC',                    // REQUIRED
    from: 'Delhi',
    to: 'Jaipur',
    departureTime: '09:00',
    arrivalTime: '14:00',
    duration: '5h',                   // REQUIRED
    price: 600,                       // REQUIRED
    totalSeats: 40,
    amenities: ['WiFi', 'Charging Point', 'Snacks', 'Water Bottle'],
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    status: 'active'
  },
  {
    busName: 'City Link',
    busNumber: 'KA01IJ7890',
    busType: 'Semi-Sleeper',          // REQUIRED
    from: 'Bangalore',
    to: 'Chennai',
    departureTime: '22:00',
    arrivalTime: '05:00',
    duration: '7h',                   // REQUIRED
    price: 800,                       // REQUIRED
    totalSeats: 40,
    amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'Blanket'],
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    status: 'active'
  }
];

const addSampleBuses = async () => {
  try {
    await Bus.deleteMany({});
    console.log('Existing buses cleared');

    // Auto-set availableSeats = totalSeats
    sampleBuses.forEach(bus => {
      bus.availableSeats = bus.totalSeats;
    });

    await Bus.insertMany(sampleBuses);
    console.log('✅ Sample buses added successfully!');
    console.log(`Total buses added: ${sampleBuses.length}`);

    // List routes
    const routes = [...new Set(sampleBuses.map(b => b.from))];
    console.log('\nAvailable routes:');
    routes.forEach(route => console.log(`- ${route}`));

    process.exit();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

addSampleBuses();
