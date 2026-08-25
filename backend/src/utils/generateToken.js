import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production environment');
}

const generateToken = (id, role = 'student') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'local-development-only-secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export default generateToken;
