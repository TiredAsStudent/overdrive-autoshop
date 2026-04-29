const jwt = require("jsonwebtoken");
const { query } = require("../config/db");
const { sendError } = require("../utils/responseHandler");
const { STATUS_CODES } = require("../constants/statusCodes");

const verifyToken = async (req, res, next) => {
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

    // ====================================================
    // KILL-SWITCH CHECK: Verify token_version against DB
    // ====================================================
    const sql = `SELECT token_version, is_active FROM users WHERE id = $1`;
    const result = await query(sql, [decoded.id]);

    const dbUser = result.rows[0];

    if (!dbUser) {
      return sendError(res, STATUS_CODES.FORBIDDEN, "User no longer exists.");
    }

    if (!dbUser.is_active) {
      return sendError(
        res,
        STATUS_CODES.FORBIDDEN,
        "Account has been deactivated.",
      );
    }

    // If the Admin triggered the Kill-Switch, the database version will be higher
    if (dbUser.token_version !== decoded.token_version) {
      return sendError(
        res,
        STATUS_CODES.FORBIDDEN,
        "Session revoked by Administrator. Please log in again.",
      );
    }

    // Attach decoded user data to request
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

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        STATUS_CODES.FORBIDDEN,
        "Access denied. Insufficient permissions.",
      );
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
