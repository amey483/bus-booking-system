const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmail = async () => {
  try {
    console.log('Testing email with configuration:');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port: 465 (SSL)');
    console.log('User:', process.env.SMTP_USER);
    console.log('Password:', process.env.SMTP_PASS ? '***configured***' : '❌ NOT SET');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('\nSending test email...');

    const info = await transporter.sendMail({
      from: `"BusBooking System" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'Test Email from BusBooking System',
      html: '<h1>Email is working! ✅</h1><p>Your email configuration is correct.</p>'
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    process.exit(0);
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

testEmail();