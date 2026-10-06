const TaxVatReportService = require("../../services/manager/taxVatReport.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class TaxVatReportController {
  static async getTaxVatReport(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const filters = {
        branch: req.query.branch || "all",
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
        source_module: req.query.source_module || "all",
        search: req.query.search || "",
      };

      const result = await TaxVatReportService.generateReport(
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
        "Tax/VAT Report compiled successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to compile Tax/VAT Report.",
        error.message,
      );
    }
  }
}

module.exports = TaxVatReportController;
