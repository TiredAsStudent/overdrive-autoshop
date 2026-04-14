const StaffInventoryService = require("../../services/staff/inventoryService");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class StaffInventoryController {
  // 1. Fetch Local Shelf
  static async getLocalStock(req, res) {
    try {
      // SECURITY: The branch context comes strictly from the verified JWT, never the frontend.
      const branchId = req.user.branch_id;
      const { search } = req.query;

      if (!branchId) {
        return sendError(
          res,
          STATUS_CODES.UNAUTHORIZED,
          "Branch context missing. Access denied.",
        );
      }

      const data = await StaffInventoryService.getLocalStock(branchId, search);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Local branch stock retrieved successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch local inventory.",
        error.message,
      );
    }
  }

  // 2. Fetch Global Enterprise Stock
  static async getGlobalStock(req, res) {
    try {
      const branchId = req.user.branch_id;
      const inventoryId = req.params.inventoryId;

      if (!branchId) {
        return sendError(
          res,
          STATUS_CODES.UNAUTHORIZED,
          "Branch context missing. Access denied.",
        );
      }

      const data = await StaffInventoryService.getOtherBranchesStock(
        inventoryId,
        branchId,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Enterprise stock retrieved successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch global inventory.",
        error.message,
      );
    }
  }
}

module.exports = StaffInventoryController;
