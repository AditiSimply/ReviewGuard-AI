/**
 * ReviewGuard AI - Authentication Middleware
 * Validates JWT bearer tokens and protects sensitive endpoints.
 */

const jwt = require("jsonwebtoken");
const { db } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "reviewguard_jwt_super_secret_key_2026";

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const rawToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const token = (rawToken && rawToken !== "null" && rawToken !== "undefined") ? rawToken : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error_type: "Authentication Required",
      message: "Authorization token is missing. Please sign in with an administrator account to access this resource."
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.users.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error_type: "Authentication Error",
        message: "User session is invalid. Account may have been removed."
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error_type: "Account Suspended",
        message: "This account has been deactivated by an administrator."
      });
    }

    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error_type: "Token Expired",
        message: "Your session has expired. Please log in again to continue."
      });
    }
    return res.status(403).json({
      success: false,
      error_type: "Invalid Token",
      message: "Authorization token is invalid or malformed."
    });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
