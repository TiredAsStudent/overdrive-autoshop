const ReceiptService = require("../../services/staff/receipt.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ReceiptController {
  static async uploadAndScan(req, res) {
    try {
      if (!req.file) {
        return sendError(
          res,
          STATUS_CODES.BAD_REQUEST,
          "No document uploaded or invalid file format.",
        );
      }

      const scanResult = await ReceiptService.processUpload(
        req.file,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        scanResult,
        "OCR processing completed. Ready for human verification.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Scan failed.",
        error.message,
      );
    }
  }

  static async getScanDetails(req, res) {
    try {
      const scan = await ReceiptService.getScanDetails(req.params.id, req.user);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        scan,
        "Scan data retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("Unauthorized")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.NOT_FOUND;
      return sendError(res, code, error.message);
    }
  }

  static async cancelScan(req, res) {
    try {
      const scan = await ReceiptService.cancelScan(
        req.params.id,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        scan,
        "Scan session discarded securely.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async verifyReceipt(req, res) {
    try {
      const expense = await ReceiptService.verifyAndPostExpense(
        req.params.id,
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        expense,
        "Receipt successfully verified and posted to operational expenses.",
      );
    } catch (error) {
      const code =
        error.message.includes("already been recorded") ||
        error.message.includes("Transaction Rejected")
          ? STATUS_CODES.CONFLICT
          : STATUS_CODES.BAD_REQUEST;

      return sendError(res, code, error.message);
    }
  }

  static async getReceiptHistory(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { search, vendor_id, start_date, end_date } = req.query;

      const result = await ReceiptService.getReceiptHistory(
        page,
        limit,
        search,
        vendor_id,
        start_date,
        end_date,
        req.user,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Archived receipt history retrieved successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch receipt history.",
        error.message,
      );
    }
  }

  static async getHistoryDetails(req, res) {
    try {
      const historyDetail = await ReceiptService.getHistoryDetails(
        req.params.id,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        historyDetail,
        "Receipt history details retrieved successfully.",
      );
    } catch (error) {
      const code = error.message.includes("Unauthorized")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.NOT_FOUND;
      return sendError(res, code, error.message);
    }
  }
}

module.exports = ReceiptController;
