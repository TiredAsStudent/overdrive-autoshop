const ExpenseModel = require("../../models/Expense");
const { logSecureAction } = require("../../utils/auditLogger");

class ExpenseApprovalService {
  static async getPendingApprovals(
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, expenses] = await Promise.all([
      ExpenseModel.countFiltered(
        search,
        "PENDING_APPROVAL",
        category,
        branchId,
      ),
      ExpenseModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        "PENDING_APPROVAL",
        category,
        branchId,
      ),
    ]);

    return {
      expenses,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async getApprovalHistory(
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, expenses] = await Promise.all([
      ExpenseModel.countApprovalHistory(search, category, branchId),
      ExpenseModel.findPaginatedApprovalHistory(
        limit,
        offset,
        search,
        category,
        branchId,
      ),
    ]);

    return {
      expenses,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async getExpenseDetails(id) {
    const expense = await ExpenseModel.findById(id);
    if (!expense) throw new Error("Expense record not found.");

    return expense;
  }

  static async _executeDecision(
    id,
    actionStatus,
    remarks,
    activeUser,
    ipAddress,
  ) {
    const expense = await ExpenseModel.findById(id);
    if (!expense) throw new Error("Expense record not found.");

    // The Model ensures atomic transaction with WHERE status = 'PENDING_APPROVAL'
    const updatedExpense = await ExpenseModel.processApprovalDecision(
      id,
      actionStatus,
      remarks || null,
      activeUser.id,
    );

    if (!updatedExpense) {
      throw new Error(
        `Conflict: This Expense is no longer pending. It may have been processed by another manager.`,
      );
    }

    const actionName =
      actionStatus === "APPROVED" ? "EXPENSE_APPROVED" : "EXPENSE_REJECTED";
    const severity = actionStatus === "APPROVED" ? "INFO" : "WARNING";

    await logSecureAction(
      activeUser.id,
      expense.branch_id,
      actionName,
      severity,
      ipAddress,
      "expenses",
      id,
      { status: expense.status },
      { status: actionStatus, remarks },
    );

    return updatedExpense;
  }

  static async approveExpense(id, remarks, activeUser, ipAddress) {
    return await this._executeDecision(
      id,
      "APPROVED",
      remarks,
      activeUser,
      ipAddress,
    );
  }

  static async rejectExpense(id, remarks, activeUser, ipAddress) {
    return await this._executeDecision(
      id,
      "REJECTED",
      remarks,
      activeUser,
      ipAddress,
    );
  }
}

module.exports = ExpenseApprovalService;
