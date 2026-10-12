const ExpenseReportService = require("../../services/manager/expenseReport.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ExpenseReportController {
  static async getExpenseReport(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const filters = {
        branch: req.query.branch || "all",
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
        category_id: req.query.category_id || "all",
        vendor_id: req.query.vendor_id || "all",
        source_module: req.query.source_module || "all",
        search: req.query.search || "",
      };

      const result = await ExpenseReportService.generateReport(
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
        "Expense Report compiled successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to compile Expense Report.",
        error.message,
      );
    }
  }
}

module.exports = ExpenseReportController;
