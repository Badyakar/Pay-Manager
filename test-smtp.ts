import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testSMTP() {
  // Replace these with your actual SMTP settings for testing
  const smtpConfig = {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER || 'YOUR_EMAIL@gmail.com',
    smtpPass: process.env.SMTP_PASS || 'YOUR_APP_PASSWORD',
  };

  console.log('Testing SMTP connection for:', smtpConfig.smtpUser);
  console.log('Host:', smtpConfig.smtpHost, 'Port:', smtpConfig.smtpPort);

  const transporter = nodemailer.createTransport({
    host: smtpConfig.smtpHost,
    port: smtpConfig.smtpPort,
    secure: smtpConfig.smtpPort === 465,
    auth: {
      user: smtpConfig.smtpUser,
      pass: smtpConfig.smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // 1. Verify connection
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection is successful!');

    // 2. Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"SMTP Test" <${smtpConfig.smtpUser}>`,
      to: smtpConfig.smtpUser, // Send to self
      subject: "SMTP Test Successful",
      text: "Hello! This is a test email from your AI Studio app. Your SMTP settings are working correctly.",
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error: any) {
    console.error('❌ SMTP Test Failed:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Tip: Check your App Password. Make sure 2-Step Verification is ON and you are using a 16-digit App Password, not your regular Gmail password.');
    } else if (error.code === 'ESOCKET') {
      console.log('\n💡 Tip: Check your internet connection or firewall. Port 587 might be blocked.');
    }
  }
}

testSMTP();
