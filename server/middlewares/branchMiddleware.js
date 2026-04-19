const { sendError } = require("../utils/responseHandler");
const { STATUS_CODES } = require("../constants/statusCodes");

const branchGuard = (req, res, next) => {
  if (!req.user) {
    return sendError(
      res,
      STATUS_CODES.UNAUTHORIZED,
      "Authentication required.",
    );
  }

  // SYSTEM ADMIN & MANAGER (OWNER): Global access
  // They can query a specific branch via URL, otherwise it defaults to null (all branches)
  if (req.user.role === "ADMIN" || req.user.role === "MANAGER") {
    req.branchId = req.query.branch_id
      ? parseInt(req.query.branch_id, 10)
      : null;
    return next();
  }

  // STAFF: Strictly locked to their assigned branch in the JWT
  // We completely ignore req.query.branch_id to prevent URL manipulation
  if (req.user.role === "STAFF") {
    if (!req.user.branchId) {
      return sendError(
        res,
        STATUS_CODES.FORBIDDEN,
        "Access Denied: No branch assignment detected for this user.",
      );
    }
    req.branchId = req.user.branchId;
    return next();
  }

  // CUSTOMER: Customers don't have branches, they have vehicles.
  return sendError(
    res,
    STATUS_CODES.FORBIDDEN,
    "Access Denied: Customers cannot perform branch operations.",
  );
};

module.exports = branchGuard;
