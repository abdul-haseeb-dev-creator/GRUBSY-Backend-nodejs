// middleware/requireRole.js
// Role-based access control middleware for admin endpoints

/**
 * Require specific roles for accessing admin endpoints
 * @param {...string} allowedRoles - Roles that are allowed to access the endpoint
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Require super_admin role for critical operations
 */
export function requireSuperAdmin(req, res, next) {
  return requireRole('super_admin')(req, res, next);
}

/**
 * Require any admin role (super_admin, admin, operations, support)
 */
export function requireAdmin(req, res, next) {
  return requireRole('super_admin', 'admin', 'operations', 'support')(req, res, next);
}

export default { requireRole, requireSuperAdmin, requireAdmin };
