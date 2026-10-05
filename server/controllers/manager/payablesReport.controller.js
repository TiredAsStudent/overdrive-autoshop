const PayablesReportService = require("../../services/manager/payablesReport.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class PayablesReportController {
  static async getPayablesReport(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const filters = {
        branch: req.query.branch || "all",
        vendor_id: req.query.vendor_id || "all",
        payment_status: req.query.payment_status || "all",
        aging_category: req.query.aging_category || "all",
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
        search: req.query.search || "",
      };

      const result = await PayablesReportService.generateReport(
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
        "Payables Report compiled successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to compile Payables Report.",
        error.message,
      );
    }
  }

  static async getVendorDetails(req, res) {
    try {
      const { vendorId } = req.params;
      const result = await PayablesReportService.getVendorDetails(
        vendorId,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Vendor payable details retrieved successfully.",
      );
    } catch (error) {
      const code = error.message.includes("not found")
        ? STATUS_CODES.NOT_FOUND
        : STATUS_CODES.INTERNAL_ERROR;
      return sendError(res, code, error.message);
    }
  }
}

module.exports = PayablesReportController;
