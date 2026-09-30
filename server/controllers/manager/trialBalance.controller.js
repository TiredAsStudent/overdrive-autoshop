const TrialBalanceService = require("../../services/manager/trialBalance.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class TrialBalanceController {
  static async getTrialBalance(req, res) {
    try {
      const filters = {
        branch: req.query.branch || "all",
        end_date: req.query.end_date || null,
        search: req.query.search || "",
        type: req.query.type || "all",
        hide_zero: req.query.hide_zero || "false",
      };

      const result = await TrialBalanceService.generateTrialBalance(
        filters,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Trial Balance verified and retrieved successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to compute Trial Balance.",
        error.message,
      );
    }
  }
}

module.exports = TrialBalanceController;
