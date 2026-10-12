const ReceivablesReportService = require("../../services/manager/receivablesReport.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ReceivablesReportController {
  static async getReceivablesReport(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const filters = {
        branch: req.query.branch || "all",
        customer_id: req.query.customer_id || "all",
        payment_status: req.query.payment_status || "all",
        aging_category: req.query.aging_category || "all",
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
        search: req.query.search || "",
      };

      const result = await ReceivablesReportService.generateReport(
        filters,
        page,
        limit,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Receivables Report compiled successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to compile Receivables Report.",
        error.message,
      );
    }
  }

  static async getCustomerDetails(req, res) {
    try {
      const { customerId } = req.params;
      const result = await ReceivablesReportService.getCustomerDetails(
        customerId,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Customer receivable details retrieved successfully.",
      );
    } catch (error) {
      const code = error.message.includes("not found")
        ? STATUS_CODES.NOT_FOUND
        : STATUS_CODES.INTERNAL_ERROR;
      return sendError(res, code, error.message);
    }
  }
}

module.exports = ReceivablesReportController;
