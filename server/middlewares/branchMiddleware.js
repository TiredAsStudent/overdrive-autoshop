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

  // SYSTEM ADMIN: Global access, can query any branch
  if (req.user.role === "ADMIN") {
    req.branchId = req.query.branch_id
      ? parseInt(req.query.branch_id, 10)
      : req.user.branchId;
    return next();
  }

  // MANAGER: Might be locked to a branch, or might have global access (null)
  if (req.user.role === "MANAGER") {
    req.branchId =
      req.user.branchId ||
      (req.query.branch_id ? parseInt(req.query.branch_id, 10) : null);
    return next();
  }

  // STAFF: Strictly locked to their assigned branch in the JWT
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
  return sendError(res, STATUS_CODES.FORBIDDEN, "Access Denied.");
};

module.exports = branchGuard;
