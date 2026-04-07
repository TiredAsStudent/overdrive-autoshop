const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/responseHandler");
const { STATUS_CODES } = require("../constants/statusCodes");

// Verify the JSON Web Token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(
        res,
        STATUS_CODES.UNAUTHORIZED,
        "Access denied. No token provided.",
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user's ID, Role, and Branch directly to the request object
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(
        res,
        STATUS_CODES.UNAUTHORIZED,
        "Session expired. Please log in again.",
      );
    }
    return sendError(
      res,
      STATUS_CODES.FORBIDDEN,
      "Invalid or corrupted token.",
    );
  }
};

// Role-Based Access Control (Check if Admin or Staff)
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        STATUS_CODES.FORBIDDEN,
        "Access denied. Insufficient permissions for this action.",
      );
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
