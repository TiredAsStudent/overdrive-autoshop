const FinanceService = require("../../services/finance.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class AccountController {
  static async getBaseCategories(req, res) {
    try {
      const data = await FinanceService.getBaseCategories();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Base 5 categories retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve categories.",
      );
    }
  }

  static async createAccount(req, res) {
    try {
      const data = await FinanceService.createAccount(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        data,
        "Chart of Account created successfully.",
      );
    } catch (error) {
      if (
        error.message.includes("already in use") ||
        error.message.includes("Invalid code")
      ) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
      }
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async updateAccount(req, res) {
    try {
      const { id } = req.params;
      const data = await FinanceService.updateAccount(
        id,
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Chart of Account updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getBalances(req, res) {
    try {
      // Fetches all branches side-by-side for the Manager
      const data = await FinanceService.getMultiBranchBalances();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Enterprise real-time balances retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve multi-branch balances.",
      );
    }
  }
}

module.exports = AccountController;
