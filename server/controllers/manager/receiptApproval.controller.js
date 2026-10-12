const ReceiptApprovalService = require("../../services/manager/receiptApproval.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ReceiptApprovalController {
  static async getPendingApprovals(req, res) {
    try {
      const branchId = req.query.branch || "all";
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { search } = req.query;

      const result = await ReceiptApprovalService.getPendingApprovals(
        page,
        limit,
        search,
        branchId,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Pending Receipts retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch pending receipt approvals.",
        error.message,
      );
    }
  }

  static async getApprovalHistory(req, res) {
    try {
      const branchId = req.query.branch || "all";
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { search } = req.query;

      const result = await ReceiptApprovalService.getApprovalHistory(
        page,
        limit,
        search,
        branchId,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Receipt approval history retrieved.",
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

  static async getReceiptDetails(req, res) {
    try {
      const receipt = await ReceiptApprovalService.getReceiptDetails(
        req.params.id,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        receipt,
        "Receipt details retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("not found")
        ? STATUS_CODES.NOT_FOUND
        : STATUS_CODES.INTERNAL_ERROR;
      return sendError(res, code, error.message);
    }
  }

  static async approveReceipt(req, res) {
    try {
      const { remarks } = req.body;
      const receipt = await ReceiptApprovalService.approveReceipt(
        req.params.id,
        remarks,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        receipt,
        `OCR Receipt ${receipt.expense_number} has been officially approved.`,
      );
    } catch (error) {
      const code = error.message.includes("Conflict")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async rejectReceipt(req, res) {
    try {
      const { remarks } = req.body;
      const receipt = await ReceiptApprovalService.rejectReceipt(
        req.params.id,
        remarks,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        receipt,
        `OCR Receipt ${receipt.expense_number} has been rejected.`,
      );
    } catch (error) {
      const code = error.message.includes("Conflict")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }
}

module.exports = ReceiptApprovalController;
