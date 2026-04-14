const AccountService = require("../../services/finance/accountService");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class AccountController {
  static async createCategory(req, res) {
    try {
      const data = await AccountService.createCategory(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        data,
        "Account category created successfully.",
      );
    } catch (error) {
      if (error.message.includes("already exists")) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
      }
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async getAllCategories(req, res) {
    try {
      const { type } = req.query; // Allows filtering via /accounts?type=EXPENSE
      const data = await AccountService.getCategories(type);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Categories retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve categories.",
      );
    }
  }

  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const data = await AccountService.updateCategory(
        id,
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Category updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getBalances(req, res) {
    try {
      // req.branchId comes from your branchGuard middleware!
      const data = await AccountService.getRealTimeBalances(req.branchId);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Real-time balances retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve balances.",
      );
    }
  }
}

module.exports = AccountController;
