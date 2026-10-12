const VendorPaymentService = require("../../services/manager/vendorPayment.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class VendorPaymentController {
  static async recordPayment(req, res) {
    try {
      const result = await VendorPaymentService.recordPayment(
        req.body,
        req.file,
        req.user,
        req.ip,
      );

      const isFullyPaid = result.updatedBill.payment_status === "PAID";
      const msg = isFullyPaid
        ? "Vendor payment disbursed securely. Bill is now fully PAID."
        : "Partial vendor disbursement recorded successfully.";

      return sendSuccess(res, STATUS_CODES.CREATED, result, msg);
    } catch (error) {
      const code =
        error.message.includes("exceeds the remaining balance") ||
        error.message.includes("fully paid") ||
        error.message.includes("RECEIVED")
          ? STATUS_CODES.CONFLICT
          : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async voidPayment(req, res) {
    try {
      const result = await VendorPaymentService.voidPayment(
        req.params.id,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Disbursement successfully voided.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getPayments(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      let { search, method, branch, vendor } = req.query;

      // Ensure branch-bound managers only see their branch's payments
      if (req.user.role === "MANAGER" && req.user.branchId) {
        branch = req.user.branchId;
      }

      const result = await VendorPaymentService.getPayments(
        page,
        limit,
        search,
        method,
        branch,
        vendor,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Vendor AP ledger retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch AP ledger.",
        error.message,
      );
    }
  }

  static async getPaymentDetails(req, res) {
    try {
      const payment = await VendorPaymentService.getPaymentDetails(
        req.params.id,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        payment,
        "Disbursement details retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.NOT_FOUND, error.message);
    }
  }

  static async getEligibleBills(req, res) {
    try {
      const bills = await VendorPaymentService.getEligibleBillsForVendor(
        req.params.vendorId,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        bills,
        "Eligible payable bills retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch outstanding bills.",
        error.message,
      );
    }
  }
}

module.exports = VendorPaymentController;
