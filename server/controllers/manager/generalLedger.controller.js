const GeneralLedgerService = require("../../services/manager/generalLedger.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class GeneralLedgerController {
  static async getAccountLedger(req, res) {
    try {
      const accountId = req.params.accountId;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const { search, branch, start_date, end_date } = req.query;

      const result = await GeneralLedgerService.getAccountLedger(
        accountId,
        page,
        limit,
        search,
        branch,
        start_date,
        end_date,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "General Ledger retrieved successfully.",
      );
    } catch (error) {
      const code = error.message.includes("not found")
        ? STATUS_CODES.NOT_FOUND
        : STATUS_CODES.INTERNAL_ERROR;

      return sendError(
        res,
        code,
        "Failed to retrieve General Ledger.",
        error.message,
      );
    }
  }
}

module.exports = GeneralLedgerController;
