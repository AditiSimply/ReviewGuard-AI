/**
 * ReviewGuard AI - Role-Based Access Control (RBAC) Middleware
 * Enforces permissions for Admin and Analyst roles (case-insensitive).
 */

function requireRole(allowedRoles) {
  const roles = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map(r => r.toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error_type: "Unauthorized",
        message: "Authentication required before accessing this protected resource."
      });
    }

    const userRole = (req.user.role || "").toLowerCase();

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error_type: "Forbidden",
        message: `Access denied. This action requires one of the following roles: [${roles.join(", ")}]. Current user role: '${req.user.role}'.`
      });
    }

    next();
  };
}

module.exports = {
  requireRole
};
