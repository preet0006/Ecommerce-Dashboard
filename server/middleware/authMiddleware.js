import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'greenfibre_jwt_super_secret_key_2026';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    req.user = jwt.verify(token, JWT_SECRET); // { id, email, role, name }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do this' });
    }
    next();
  };
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET); // { id, email, role, name }
    } catch {
      // Token is invalid/expired; continue without attaching req.user
    }
  }
  next();
}

