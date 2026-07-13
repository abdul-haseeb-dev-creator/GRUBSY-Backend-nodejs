// grubsy-backend/src/middleware/driverAuth.js
import jwt from 'jsonwebtoken';
import { unauthorized } from '../utils/validate.js';

/**
 * Middleware to authenticate driver JWT tokens
 */
export function authenticateDriver(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Missing or invalid authorization header');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify this is a driver token
    // Accept tokens that have role: 'driver'. If audience is present, it must be 'driver',
    // but don't fail tokens that omit aud (older tokens from existing driver login).
    if (payload.role !== 'driver' || (payload.aud && payload.aud !== 'driver')) {
      return unauthorized(res, 'Invalid driver token');
    }

    // Add driver ID to request object
    req.driverId = payload.sub;
    
    next();
  } catch (error) {
    console.error('Driver token verification error:', error);
    return unauthorized(res, 'Invalid or expired token');
  }
}