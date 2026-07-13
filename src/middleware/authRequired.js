// grubsy-backend/src/middleware/authRequired.js
import jwt from 'jsonwebtoken';
import { unauthorized, forbidden } from '../utils/validate.js';

export function authRequired(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return unauthorized(res, 'missing bearer token');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Handle different token types
    if (payload.aud === 'merchant') {
      // Merchant token - includes partnerId
      req.user = {
        id: payload.sub,
        role: payload.role || 'MERCHANT',
        partnerId: payload.partnerId,
        type: 'merchant'
      };
    } else {
      // Regular user token
      req.user = {
        id: payload.sub,
        role: payload.role || 'CUSTOMER',
        type: 'customer'
      };
    }

    next();
  } catch (e) {
    return forbidden(res, 'invalid or expired token');
  }
}

/**
 * Middleware specifically for merchant authentication
 */
export function merchantAuthRequired(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return unauthorized(res, 'missing bearer token');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Verify this is a merchant token
    if (payload.aud !== 'merchant' || payload.role !== 'MERCHANT') {
      return unauthorized(res, 'invalid merchant token');
    }

    // Add merchant data to request
    req.merchant = {
      id: payload.sub,
      partnerId: payload.partnerId,
      role: payload.role
    };

    next();
  } catch (e) {
    return forbidden(res, 'invalid or expired merchant token');
  }
}