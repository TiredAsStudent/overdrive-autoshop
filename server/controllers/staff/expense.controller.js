const ExpenseService = require("../../services/staff/expense.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ExpenseController {
  static async createExpense(req, res) {
    try {
      const expense = await ExpenseService.createExpense(
        req.body,
        req.user,
        req.ip,
      );
      const msg = req.body.is_submitting
        ? "Expense recorded and submitted for managerial approval."
        : "Expense drafted successfully.";
      return sendSuccess(res, STATUS_CODES.CREATED, expense, msg);
    } catch (error) {
      const code = error.message.includes("already exists")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async getExpenses(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      let { search, status, category, branch } = req.query;

      if (req.user.role === "STAFF") branch = req.user.branchId;

      const result = await ExpenseService.getExpenses(
        page,
        limit,
        search,
        status,
        category,
        branch,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Operational expenses retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch expenses.",
        error.message,
      );
    }
  }

  static async getExpenseDetails(req, res) {
    try {
      const expense = await ExpenseService.getExpenseDetails(
        req.params.id,
        req.user,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        expense,
        "Expense details retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("Unauthorized")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.NOT_FOUND;
      return sendError(res, code, error.message);
    }
  }

  static async updateExpense(req, res) {
    try {
      const expense = await ExpenseService.updateExpense(
        req.params.id,
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        expense,
        "Expense updated successfully.",
      );
    } catch (error) {
      const code = error.message.includes("Document Locked")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async updateStatus(req, res) {
    try {
      const expense = await ExpenseService.updateStatus(
        req.params.id,
        req.body.status,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        expense,
        `Expense successfully submitted for approval.`,
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = ExpenseController;
