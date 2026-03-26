const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/responseHandler");
const UserModel = require("../models/userModel");

// Verify JWT & Extract Context
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Authentication required. Missing token.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserModel.findById(decoded.id);

    if (!user || !user.is_active) {
      return sendError(res, 403, "Account is disabled or no longer exists.");
    }

    // Attach user identity and branch context to the request object
    req.user = {
      id: user.id,
      role: user.role,
      branchId: user.branch_id,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Session expired. Please log in again.");
    }
    return sendError(res, 401, "Invalid authentication token.");
  }
};

// Role-Based Access Control (RBAC)
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, "Access denied. Insufficient permissions.");
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
