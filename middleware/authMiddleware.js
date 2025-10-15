const jwt = require('jsonwebtoken');
const db = require('../db');

// Middleware to verify the JWT token
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const query = `
      SELECT u.user_id, u.username, r.role_name
      FROM Users u
      JOIN Roles r ON u.role_id = r.role_id
      WHERE u.user_id = $1
    `;
    const { rows } = await db.query(query, [decoded.id]);
    
    if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = rows[0]; // Attach user info to the request object
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// Middleware for role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role_name}' is not authorized to access this route`,
      });
    }
    next();
  };
};