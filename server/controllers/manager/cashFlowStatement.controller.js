const CashFlowStatementService = require("../../services/manager/cashFlowStatement.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class CashFlowStatementController {
  static async getCashFlowStatement(req, res) {
    try {
      const filters = {
        branch: req.query.branch || "all",
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        hide_zero: req.query.hide_zero || "false",
      };

      const result = await CashFlowStatementService.generateCashFlowStatement(
        filters,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Cash Flow Statement compiled successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to compile Cash Flow Statement.",
        error.message,
      );
    }
  }
}

module.exports = CashFlowStatementController;
