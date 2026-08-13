const StaffStockAdjustmentService = require("../../services/staff/stockAdjustment.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class StaffStockAdjustmentController {
  static async createRequest(req, res) {
    try {
      if (req.file) {
        req.body.evidence_url = req.file.path.replace(/\\/g, "/");
      }

      const request = await StaffStockAdjustmentService.createRequest(
        req.body,
        req.user.id,
        req.branchId,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        request,
        `Adjustment request ${request.adjustment_number} submitted for manager review.`,
      );
    } catch (error) {
      const statusCode = error.message.includes("already exists")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;

      return sendError(res, statusCode, error.message);
    }
  }

  static async getRequests(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || "";
      const status = req.query.status || "all";

      const result = await StaffStockAdjustmentService.getRequests(
        req.branchId,
        page,
        limit,
        search,
        status,
      );

      return res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        data: result.requests,
        pagination: result.pagination,
        message: "Branch adjustment requests retrieved successfully.",
      });
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve adjustment requests.",
        error.message,
      );
    }
  }
}

module.exports = StaffStockAdjustmentController;
