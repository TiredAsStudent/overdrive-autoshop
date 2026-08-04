const COAService = require("../../services/manager/chartOfAccounts.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ChartOfAccountsController {
  static async createAccount(req, res) {
    try {
      const account = await COAService.createAccount(
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        account,
        "Account created successfully.",
      );
    } catch (error) {
      const code = error.message.includes("already exists")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async updateAccount(req, res) {
    try {
      const account = await COAService.updateAccount(
        req.params.id,
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        account,
        "Account updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async toggleStatus(req, res) {
    try {
      const { is_active } = req.body;
      const account = await COAService.toggleStatus(
        req.params.id,
        is_active,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        account,
        `Account ${is_active ? "activated" : "deactivated"} successfully.`,
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getAccounts(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { search, type, status } = req.query;

      const result = await COAService.getAccounts(
        page,
        limit,
        search,
        type,
        status,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Chart of Accounts retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve accounts.",
        error.message,
      );
    }
  }

  static async getAccountDetails(req, res) {
    try {
      const account = await COAService.getAccountDetails(req.params.id);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        account,
        "Account details retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.NOT_FOUND, error.message);
    }
  }
}

module.exports = ChartOfAccountsController;
