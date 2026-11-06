const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
  const authorization = req.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, avatarUrl: true, role: true, preferredLanguage: true }
    });

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// const requireAdmin = (req, res, next) => {
//   if (req.user?.role !== 'ADMIN') {
//     return res.status(403).json({ message: 'Admin access required' });
//   }

//   return next();
// };

const requireAdmin = (req, res, next) => {
  // req.user is populated by the 'protect' middleware
  if (req.user && req.user.role === 'ADMIN') {
    next(); // User is an admin, let them pass
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' }); // Block normal users
  }
};

module.exports = { protect, requireAdmin };