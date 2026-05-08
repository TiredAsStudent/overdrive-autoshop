const CoaService = require("../../services/manager/coa.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class CoaController {
  static async createAccount(req, res) {
    try {
      const account = await CoaService.createAccount(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        account,
        "Financial account created successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getAccounts(req, res) {
    try {
      const accounts = await CoaService.getAllAccounts();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        accounts,
        "Chart of Accounts retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve accounts.",
      );
    }
  }

  static async updateAccount(req, res) {
    try {
      const account = await CoaService.updateAccount(
        req.params.id,
        req.body,
        req.user.id,
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
}

module.exports = CoaController;
