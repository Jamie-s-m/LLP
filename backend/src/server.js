import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI;

if (process.env.NODE_ENV === 'production' && (!MONGODB_URI || !process.env.JWT_SECRET)) {
  throw new Error('MONGODB_URI and JWT_SECRET must be configured in production');
}

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI must be configured before starting the API');
}

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);

    const server = app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Unable to start API:', error.message);
    process.exit(1);
  }
};

startServer();