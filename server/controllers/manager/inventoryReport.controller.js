const InventoryReportService = require("../../services/manager/inventoryReport.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class InventoryReportController {
  static async getInventoryReport(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const filters = {
        branch: req.query.branch || "all",
        category: req.query.category || "all",
        stock_status: req.query.stock_status || "all",
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
        search: req.query.search || "",
      };

      const result = await InventoryReportService.generateReport(
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
        "Inventory Report compiled successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to compile Inventory Report.",
        error.message,
      );
    }
  }
}

module.exports = InventoryReportController;
