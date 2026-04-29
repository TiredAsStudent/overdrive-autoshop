const StaffBillingService = require("../../services/staffBilling.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class BillingController {
  static async getSalesOrders(req, res) {
    try {
      const data = await StaffBillingService.getActiveSalesOrders(
        req.user.branchId,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Active Sales Orders retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async getInvoices(req, res) {
    try {
      const data = await StaffBillingService.getFinalizedInvoices(
        req.user.branchId,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Archived Invoices retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async cancelOrder(req, res) {
    try {
      await StaffBillingService.cancelOrder(req.params.id, req.user, req.ip);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        null,
        "Sales order cancelled. Inventory released.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async finalizeInvoice(req, res) {
    try {
      const paymentData = {
        method: req.body.method,
        amount_tendered: req.body.amount_tendered,
        reference: req.body.reference,
      };

      const result = await StaffBillingService.finalizePayment(
        req.params.id,
        paymentData,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        `Invoice ${result.invoiceRef} successfully posted.`,
      );
    } catch (error) {
      const statusCode = error.message.includes("Invalid")
        ? STATUS_CODES.BAD_REQUEST
        : STATUS_CODES.INTERNAL_ERROR;
      return sendError(res, statusCode, error.message);
    }
  }
}

module.exports = BillingController;
