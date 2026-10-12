const IncomeStatementService = require("../../services/manager/incomeStatement.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class IncomeStatementController {
  static async getIncomeStatement(req, res) {
    try {
      const filters = {
        branch: req.query.branch || "all",
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        hide_zero: req.query.hide_zero || "false",
      };

      const result = await IncomeStatementService.generateIncomeStatement(
        filters,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Income Statement generated successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to generate Income Statement.",
        error.message,
      );
    }
  }
}

module.exports = IncomeStatementController;
