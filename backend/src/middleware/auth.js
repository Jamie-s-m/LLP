import jwt from 'jsonwebtoken';
import User from '../models/User.js';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production environment');
}

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-secret';
export const MODERATOR_PERMISSION_KEYS = ['communityModeration', 'supportChat', 'catalogContentQa', 'limitedUserManagement'];
export const defaultModeratorPermissions = () => ({
  communityModeration: false,
  supportChat: false,
  catalogContentQa: false,
  limitedUserManagement: false,
});

export const normalizeModeratorPermissions = (input = {}) => {
  const normalized = defaultModeratorPermissions();
  MODERATOR_PERMISSION_KEYS.forEach((key) => {
    normalized[key] = Boolean(input[key]);
  });
  return normalized;
};

export const hasModeratorPermission = (user, permission) =>
  user?.role === 'admin' || (user?.role === 'moderator' && Boolean(user?.moderatorPermissions?.[permission]));

export const hasAnyModeratorPermission = (user, permissions = []) =>
  user?.role === 'admin' || permissions.some((permission) => hasModeratorPermission(user, permission));

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id || decoded._id;
    req.user = await User.findById(userId);

    if (!req.user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: 'This account is inactive' });
    }

    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

export const authorizeRoleOrPermission = ({ roles = [], permissions = [] }) => {
  return (req, res, next) => {
    if (roles.includes(req.user.role) || hasAnyModeratorPermission(req.user, permissions)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `User role '${req.user.role}' is not authorized to access this route`,
    });
  };
};

export const checkUserExists = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    req.targetUser = user;
    next();
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }
};
