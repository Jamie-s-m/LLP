import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const resetAdminPassword = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is undefined in backend/.env.');
    }

    // Connect with TLS flags to prevent local network handshake blocks
    await mongoose.connect(mongoUri, {
      tlsAllowInvalidCertificates: true,
      tls: true,
    });

    const user = await User.findOne({ email: 'moreartyjames@gmail.com' });
    if (!user) {
      console.log('User not found in database!');
      process.exit(1);
    }

    user.password = 'Password123!';
    user.isEmailVerified = true;
    await user.save();

    console.log('Password successfully reset and hashed for moreartyjames@gmail.com!');
    process.exit();
  } catch (err) {
    console.error('Reset Error:', err.message);
    process.exit(1);
  }
};

resetAdminPassword();