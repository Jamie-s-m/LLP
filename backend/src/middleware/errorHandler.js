import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  void next;
  let error = { ...err };
  error.message = err.message;

  // This is the app-wide catch-all (registered last in app.js), so it runs in production
  // too, not just dev - route through the real logger instead of a bare console.error so
  // these show up with the same structured format/transports as every other logged error.
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = `Duplicate field value entered`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
  });
};
