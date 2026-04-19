const { sendError } = require("../utils/responseHandler");
const { STATUS_CODES } = require("../constants/statusCodes");
const Branch = require("../models/Branch");

const branchGuard = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendError(
        res,
        STATUS_CODES.UNAUTHORIZED,
        "Authentication required.",
      );
    }

    // SYSTEM ADMIN & MANAGER (OWNER): Global access
    if (req.user.role === "ADMIN" || req.user.role === "MANAGER") {
      req.branchId = req.query.branch_id
        ? parseInt(req.query.branch_id, 10)
        : null;
      return next();
    }

    // STAFF: Strictly locked to their assigned branch
    if (req.user.role === "STAFF") {
      if (!req.user.branchId) {
        return sendError(
          res,
          STATUS_CODES.FORBIDDEN,
          "Access Denied: No branch assignment detected for this user.",
        );
      }

      req.branchId = req.user.branchId;

      const branch = await Branch.getStatusById(req.branchId);

      if (!branch) {
        return sendError(res, STATUS_CODES.FORBIDDEN, "Branch does not exist.");
      }
      if (!branch.is_active) {
        return sendError(
          res,
          STATUS_CODES.FORBIDDEN,
          "Your branch is archived.",
        );
      }
      if (branch.is_maintenance_mode) {
        // We use the exact "MAINTENANCE_MODE" string for the frontend interceptor
        return res.status(STATUS_CODES.FORBIDDEN).json({
          success: false,
          error: {
            message: "MAINTENANCE_MODE",
            details: "This branch is under maintenance.",
          },
        });
      }

      return next();
    }

    // CUSTOMER
    return sendError(
      res,
      STATUS_CODES.FORBIDDEN,
      "Access Denied: Customers cannot perform branch operations.",
    );
  } catch (error) {
    return sendError(
      res,
      STATUS_CODES.INTERNAL_ERROR,
      "Branch security check failed",
      error.message,
    );
  }
};

module.exports = branchGuard;
