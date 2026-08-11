const StaffInventoryService = require("../../services/staff/inventory.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class StaffInventoryController {
  static async getInventory(req, res) {
    try {
      let branchId = req.branchId;

      if (
        !branchId &&
        (req.user.role === "MANAGER" || req.user.role === "ADMIN")
      ) {
        branchId = 2;
      }

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || "";
      const category = req.query.category || "all";
      const stockStatus = req.query.stock_status || "all";

      const result = await StaffInventoryService.getBranchInventory(
        branchId,
        page,
        limit,
        search,
        category,
        stockStatus,
      );

      return res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        message: "Branch inventory retrieved successfully.",
      });
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve branch inventory.",
        error.message,
      );
    }
  }

  static async getInventoryDetails(req, res) {
    try {
      let branchId = req.branchId;

      if (
        !branchId &&
        (req.user.role === "MANAGER" || req.user.role === "ADMIN")
      ) {
        branchId = 2;
      }

      const details = await StaffInventoryService.getItemDetails(
        req.params.id,
        branchId,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        details,
        "Item details retrieved securely.",
      );
    } catch (error) {
      const statusCode = error.message.includes("not found")
        ? STATUS_CODES.NOT_FOUND
        : STATUS_CODES.BAD_REQUEST;

      return sendError(res, statusCode, error.message);
    }
  }

  static async getMovementHistory(req, res) {
    try {
      let branchId = req.branchId;

      if (
        !branchId &&
        (req.user.role === "MANAGER" || req.user.role === "ADMIN")
      ) {
        branchId = 2;
      }

      const history = await StaffInventoryService.getItemMovementHistory(
        req.params.id,
        branchId,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        history,
        "Branch movement ledger retrieved securely.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve movement history.",
        error.message,
      );
    }
  }
}

module.exports = StaffInventoryController;
