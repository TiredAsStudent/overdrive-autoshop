const PaymentService = require("../../services/staff/payment.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class PaymentController {
  static async recordPayment(req, res) {
    try {
      const result = await PaymentService.recordPayment(
        req.body,
        req.file,
        req.user,
        req.ip,
      );

      const isFullyPaid = result.updatedInvoice.status === "PAID";
      const msg = isFullyPaid
        ? "Payment recorded successfully. Invoice is now fully PAID."
        : "Partial payment recorded successfully.";

      return sendSuccess(res, STATUS_CODES.CREATED, result, msg);
    } catch (error) {
      const code =
        error.message.includes("exceeds the remaining balance") ||
        error.message.includes("fully paid") ||
        error.message.includes("voided")
          ? STATUS_CODES.CONFLICT
          : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async voidPayment(req, res) {
    try {
      const result = await PaymentService.voidPayment(
        req.params.id,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Payment successfully voided and balances reversed.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getPayments(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      let { search, method, branch } = req.query;

      if (req.user.role === "STAFF") {
        branch = req.user.branchId;
      }

      const result = await PaymentService.getPayments(
        page,
        limit,
        search,
        method,
        branch,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Payments ledger retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch payments.",
        error.message,
      );
    }
  }

  static async getPaymentDetails(req, res) {
    try {
      const payment = await PaymentService.getPaymentDetails(
        req.params.id,
        req.user,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        payment,
        "Payment details retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("Unauthorized")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.NOT_FOUND;
      return sendError(res, code, error.message);
    }
  }
}

module.exports = PaymentController;
