/**
 * Authentication Context Middleware - Security Hardening Phase A
 * 
 * Implements immutable authentication context with JWT validation,
 * role-based access control, and race condition prevention.
 */

const jwt = require('jsonwebtoken');
const logger = require('../src/utils/logger');

// JWT claims cache to prevent race conditions
const jwtClaimsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clean up expired JWT claims from cache
 */
function cleanupJWTCache() {
  const now = Date.now();
  for (const [token, data] of jwtClaimsCache.entries()) {
    if (now > data.expiresAt) {
      jwtClaimsCache.delete(token);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupJWTCache, CACHE_TTL);

/**
 * Create immutable authentication context
 * @param {Object} user - User data
 * @param {Object} token - Token data
 * @returns {Object} Immutable auth context
 */
function createAuthContext(user, token) {
  const context = {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      establishmentId: user.establishmentId,
      driverId: user.driverId,
      isActive: user.isActive !== false,
      emailVerified: user.emailVerified || false,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    },
    token: {
      iat: token.iat,
      exp: token.exp,
      aud: token.aud,
      iss: token.iss,
      sub: token.sub,
      jti: token.jti
    },
    session: {
      id: token.jti || `session_${Date.now()}`,
      createdAt: new Date(token.iat * 1000).toISOString(),
      expiresAt: new Date(token.exp * 1000).toISOString(),
      isValid: true
    },
    permissions: {
      canCreateOrders: hasPermission(user, 'orders:create'),
      canViewOrders: hasPermission(user, 'orders:read'),
      canUpdateOrders: hasPermission(user, 'orders:update'),
      canDeleteOrders: hasPermission(user, 'orders:delete'),
      canManageEstablishment: hasPermission(user, 'establishment:manage'),
      canViewAnalytics: hasPermission(user, 'analytics:read'),
      canProcessPayments: hasPermission(user, 'payments:process'),
      canManageDrivers: hasPermission(user, 'drivers:manage'),
      isAdmin: user.role === 'admin',
      isEstablishment: user.role === 'establishment',
      isDriver: user.role === 'driver',
      isUser: user.role === 'user'
    }
  };
  
  // Make the context immutable
  return Object.freeze({
    ...context,
    user: Object.freeze(context.user),
    token: Object.freeze(context.token),
    session: Object.freeze(context.session),
    permissions: Object.freeze(context.permissions)
  });
}

/**
 * Check if user has specific permission
 * @param {Object} user - User object
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
function hasPermission(user, permission) {
  if (!user || !user.permissions) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // Check explicit permissions
  if (user.permissions.includes(permission)) return true;
  
  // Check role-based permissions
  const rolePermissions = {
    establishment: [
      'orders:read',
      'orders:update',
      'establishment:manage',
      'analytics:read',
      'menu:manage'
    ],
    driver: [
      'orders:read',
      'orders:update',
      'location:update',
      'earnings:read'
    ],
    user: [
      'orders:create',
      'orders:read',
      'profile:update'
    ]
  };
  
  const userRolePermissions = rolePermissions[user.role] || [];
  return userRolePermissions.includes(permission);
}

/**
 * Extract and validate JWT token from request
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null if not found
 */
function extractToken(req) {
  // Check Authorization header
  const authHeader = req.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check query parameter (for WebSocket connections)
  if (req.query && req.query.token) {
    return req.query.token;
  }
  
  // Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
}

/**
 * Validate JWT token and extract claims
 * @param {string} token - JWT token
 * @returns {Object|null} Token claims or null if invalid
 */
function validateToken(token) {
  try {
    // Check cache first to prevent race conditions
    const cached = jwtClaimsCache.get(token);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.claims;
    }
    
    // Verify token
    const claims = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'grubsy-api',
      audience: process.env.JWT_AUDIENCE || 'grubsy-platform'
    });
    
    // Cache the claims
    jwtClaimsCache.set(token, {
      claims,
      expiresAt: Date.now() + CACHE_TTL
    });
    
    return claims;
  } catch (error) {
    logger.debug('JWT validation failed', { 
      error: error.message,
      tokenPrefix: token ? token.substring(0, 10) + '...' : 'null'
    });
    return null;
  }
}

/**
 * Authentication middleware - validates JWT and creates auth context
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
function authenticationMiddleware(options = {}) {
  const { 
    required = true,
    roles = [],
    permissions = [],
    skipPaths = ['/health', '/metrics']
  } = options;

  return async (req, res, next) => {
    // Skip authentication for specified paths
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    const token = extractToken(req);
    
    // Handle missing token
    if (!token) {
      if (required) {
        logger.warn('Authentication required but no token provided', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Valid authentication token is required',
          code: 'AUTH_TOKEN_REQUIRED'
        });
      }
      
      // Create anonymous context
      req.auth = createAuthContext(
        { id: null, role: 'anonymous', permissions: [] },
        { iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }
      );
      
      return next();
    }
    
    // Validate token
    const claims = validateToken(token);
    if (!claims) {
      logger.warn('Invalid authentication token', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        tokenPrefix: token.substring(0, 10) + '...'
      });
      
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
    
    // Check token expiration
    if (claims.exp && Date.now() >= claims.exp * 1000) {
      logger.warn('Expired authentication token', {
        path: req.path,
        method: req.method,
        userId: claims.id,
        expiredAt: new Date(claims.exp * 1000).toISOString()
      });
      
      return res.status(401).json({
        error: 'Token expired',
        message: 'Authentication token has expired',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }
    
    // Create user object from claims
    const user = {
      id: claims.id || claims.sub,
      email: claims.email,
      role: claims.role,
      permissions: claims.permissions || [],
      establishmentId: claims.establishmentId,
      driverId: claims.driverId,
      isActive: claims.isActive !== false,
      emailVerified: claims.emailVerified || false,
      createdAt: claims.createdAt,
      lastLogin: claims.lastLogin
    };
    
    // Check role requirements
    if (roles.length > 0 && !roles.includes(user.role)) {
      logger.warn('Insufficient role permissions', {
        path: req.path,
        method: req.method,
        userId: user.id,
        userRole: user.role,
        requiredRoles: roles
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required role: ${roles.join(' or ')}`,
        code: 'INSUFFICIENT_ROLE_PERMISSIONS'
      });
    }
    
    // Check specific permissions
    if (permissions.length > 0) {
      const hasRequiredPermissions = permissions.every(permission => 
        hasPermission(user, permission)
      );
      
      if (!hasRequiredPermissions) {
        logger.warn('Insufficient permissions', {
          path: req.path,
          method: req.method,
          userId: user.id,
          userPermissions: user.permissions,
          requiredPermissions: permissions
        });
        
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Required permissions: ${permissions.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }
    
    // Create immutable auth context
    req.auth = createAuthContext(user, claims);
    
    logger.debug('Authentication successful', {
      userId: user.id,
      role: user.role,
      path: req.path,
      method: req.method
    });
    
    next();
  };
}

/**
 * Role-based access control middleware
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
  return authenticationMiddleware({
    required: true,
    roles: allowedRoles
  });
}

/**
 * Permission-based access control middleware
 * @param {Array<string>} requiredPermissions - Array of required permissions
 * @returns {Function} Express middleware
 */
function requirePermission(...requiredPermissions) {
  return authenticationMiddleware({
    required: true,
    permissions: requiredPermissions
  });
}

/**
 * Optional authentication middleware
 * @returns {Function} Express middleware
 */
function optionalAuth() {
  return authenticationMiddleware({
    required: false
  });
}

/**
 * Get authentication statistics
 * @returns {Object} Authentication statistics
 */
function getAuthStats() {
  return {
    cachedTokens: jwtClaimsCache.size,
    cacheHitRate: 0, // Would need to track hits/misses
    memoryUsage: process.memoryUsage()
  };
}

/**
 * Clear authentication cache (for testing/maintenance)
 */
function clearAuthCache() {
  const count = jwtClaimsCache.size;
  jwtClaimsCache.clear();
  logger.info('Cleared authentication cache', { clearedCount: count });
  return count;
}

module.exports = {
  authenticationMiddleware,
  requireRole,
  requirePermission,
  optionalAuth,
  createAuthContext,
  hasPermission,
  validateToken,
  getAuthStats,
  clearAuthCache
};