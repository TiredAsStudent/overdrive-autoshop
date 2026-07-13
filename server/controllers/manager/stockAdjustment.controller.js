const StockAdjustmentService = require("../../services/manager/stockAdjustment.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class StockAdjustmentController {
  static async getRequests(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || "";
      const status = req.query.status || "PENDING";

      const result = await StockAdjustmentService.getRequests(
        page,
        limit,
        search,
        status,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Adjustment requests retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve adjustments.",
        error.message,
      );
    }
  }

  static async approveRequest(req, res) {
    try {
      const { manager_remarks } = req.body;
      const request = await StockAdjustmentService.approve(
        req.params.id,
        req.user,
        req.ip,
        manager_remarks,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        request,
        "Adjustment request officially approved. Inventory updated.",
      );
    } catch (error) {
      const statusCode = error.message.includes("Concurrency Conflict")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, statusCode, error.message);
    }
  }

  static async rejectRequest(req, res) {
    try {
      const { manager_remarks } = req.body;
      const request = await StockAdjustmentService.reject(
        req.params.id,
        req.user,
        req.ip,
        manager_remarks,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        request,
        "Adjustment request rejected. Inventory unchanged.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = StockAdjustmentController;
