const ExpenseService = require("../../services/manager/expense.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ExpenseController {
  static async getPending(req, res) {
    try {
      const branchId = req.query.branch_id || req.user.branchId;
      const data = await ExpenseService.getPendingExpenses(branchId);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Pending expenses loaded.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async getRejectionLogs(req, res) {
    try {
      const branchId = req.query.branch_id || req.user.branchId;
      const data = await ExpenseService.getRejectionLogs(branchId);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Rejection logs loaded successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to load rejection logs.",
        error.message,
      );
    }
  }

  static async approve(req, res) {
    try {
      const expenseId = req.params.id;
      const branchId = req.body.branch_id || req.user.branchId;

      const result = await ExpenseService.approveExpense(
        expenseId,
        req.body,
        branchId,
        req.user.id,
        req.ip,
      );
      return sendSuccess(res, STATUS_CODES.SUCCESS, null, result.message);
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async reject(req, res) {
    try {
      const expenseId = req.params.id;
      const { rejection_reason, rejection_category } = req.body;
      const branchId = req.user.branchId;

      await ExpenseService.rejectExpense(
        expenseId,
        rejection_reason,
        rejection_category,
        branchId,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        null,
        "Expense returned to staff for correction.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = ExpenseController;
