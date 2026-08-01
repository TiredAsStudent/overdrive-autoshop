const ExpenseApprovalService = require("../../services/manager/expenseApproval.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ExpenseApprovalController {
  static async getPendingApprovals(req, res) {
    try {
      const branchId = req.query.branch || "all";
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { search, category } = req.query;

      const result = await ExpenseApprovalService.getPendingApprovals(
        page,
        limit,
        search,
        category,
        branchId,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Pending Expenses retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch pending expense approvals.",
        error.message,
      );
    }
  }

  static async getApprovalHistory(req, res) {
    try {
      const branchId = req.query.branch || "all";
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { search, category } = req.query;

      const result = await ExpenseApprovalService.getApprovalHistory(
        page,
        limit,
        search,
        category,
        branchId,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Expense approval history retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch expense history.",
        error.message,
      );
    }
  }

  static async getExpenseDetails(req, res) {
    try {
      const expense = await ExpenseApprovalService.getExpenseDetails(
        req.params.id,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        expense,
        "Expense details retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("not found")
        ? STATUS_CODES.NOT_FOUND
        : STATUS_CODES.INTERNAL_ERROR;
      return sendError(res, code, error.message);
    }
  }

  static async approveExpense(req, res) {
    try {
      const { remarks } = req.body;
      const expense = await ExpenseApprovalService.approveExpense(
        req.params.id,
        remarks,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        expense,
        `Expense ${expense.expense_number} has been officially approved.`,
      );
    } catch (error) {
      const code = error.message.includes("Conflict")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async rejectExpense(req, res) {
    try {
      const { remarks } = req.body;
      const expense = await ExpenseApprovalService.rejectExpense(
        req.params.id,
        remarks,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        expense,
        `Expense ${expense.expense_number} has been rejected.`,
      );
    } catch (error) {
      const code = error.message.includes("Conflict")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }
}

module.exports = ExpenseApprovalController;
