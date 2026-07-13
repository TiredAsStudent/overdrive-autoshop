const StockTransferService = require("../../services/manager/stockTransfer.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class StockTransferController {
  static async getTransfers(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || "";
      const sourceBranch = req.query.source_branch || "all";
      const destBranch = req.query.dest_branch || "all";

      const result = await StockTransferService.getTransfers(
        page,
        limit,
        search,
        sourceBranch,
        destBranch,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Stock transfers retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve transfers.",
        error.message,
      );
    }
  }

  static async executeTransfer(req, res) {
    try {
      const transfer = await StockTransferService.executeTransfer(
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        transfer,
        `Transfer executed successfully. Reference: ${transfer.transfer_reference}`,
      );
    } catch (error) {
      // 409 Conflict if stock ran out concurrently, otherwise 400 Bad Request
      const statusCode = error.message.includes("Insufficient stock")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, statusCode, error.message);
    }
  }
}

module.exports = StockTransferController;
