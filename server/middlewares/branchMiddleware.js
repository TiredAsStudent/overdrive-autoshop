const { sendError } = require("../utils/responseHandler");
const { STATUS_CODES } = require("../constants/statusCodes");

const branchGuard = (req, res, next) => {
  // Check if the user object exists (from verifyToken)
  if (!req.user) {
    return sendError(
      res,
      STATUS_CODES.UNAUTHORIZED,
      "Authentication required.",
    );
  }

  //  ADMIN Logic: Admins are not locked to a branch
  if (req.user.role === "ADMIN") {
    // Admins can optionally pass a branch_id in the query to switch "lenses"
    // e.g., /api/v1/inventory?branch_id=2
    req.branchId = req.query.branch_id
      ? parseInt(req.query.branch_id, 10)
      : req.user.branchId;
    return next();
  }

  //  STAFF Logic: Staff are strictly locked to the branch in their JWT token
  if (req.user.branchId) {
    req.branchId = req.user.branchId;
    return next();
  }

  // Fallback Safety: If a staff member somehow has no branch, block them.
  return sendError(
    res,
    STATUS_CODES.FORBIDDEN,
    "Access Denied: No branch assignment detected for this user.",
  );
};

module.exports = branchGuard;
