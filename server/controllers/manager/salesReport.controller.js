const SalesReportService = require("../../services/manager/salesReport.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class SalesReportController {
  static async getSalesReport(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const filters = {
        branch: req.query.branch || "all",
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
        customer_id: req.query.customer_id || "all",
        payment_status: req.query.payment_status || "all",
        search: req.query.search || "",
      };

      const result = await SalesReportService.generateReport(
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
        "Sales Report compiled successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to compile Sales Report.",
        error.message,
      );
    }
  }
}

module.exports = SalesReportController;
