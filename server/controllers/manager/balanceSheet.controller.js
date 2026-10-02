const BalanceSheetService = require("../../services/manager/balanceSheet.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class BalanceSheetController {
  static async getBalanceSheet(req, res) {
    try {
      const filters = {
        branch: req.query.branch || "all",
        as_of_date: req.query.as_of_date,
        hide_zero: req.query.hide_zero || "false",
      };

      const result = await BalanceSheetService.generateBalanceSheet(
        filters,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Balance Sheet generated successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to generate Balance Sheet.",
        error.message,
      );
    }
  }
}

module.exports = BalanceSheetController;
