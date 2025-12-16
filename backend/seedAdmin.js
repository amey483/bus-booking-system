const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// Create admin user
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@busbooking.com' });
    
    if (adminExists) {
      console.log('❌ Admin user already exists');
      process.exit();
    }

    // Create admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@busbooking.com',
      password: 'admin123',
      phone: '9999999999',
      role: 'admin'
    });

    console.log('✅ Admin user created successfully');
    console.log('Email: admin@busbooking.com');
    console.log('Password: admin123');
    
    process.exit();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();