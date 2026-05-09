const Expense = require("../../models/Expense");
const { logSecureAction } = require("../../utils/auditLogger");

class ExpenseService {
  static async getPendingExpenses(branchId) {
    return await Expense.getPending(branchId);
  }

  static async getRejectionLogs(branchId) {
    return await Expense.getRejectedLogs(branchId);
  }

  static async approveExpense(expenseId, data, branchId, managerId, ipAddress) {
    if (data.supplier_id) {
      const isDuplicate = await Expense.checkDuplicate(
        data.supplier_id,
        data.transaction_date,
        data.total_amount,
      );
      if (isDuplicate) {
        throw new Error(
          "Potential Duplicate: A verified expense with this supplier, date, and amount already exists.",
        );
      }
    }

    await Expense.approveAtomic(expenseId, data, branchId);

    await logSecureAction(
      managerId,
      branchId,
      "OCR_EXPENSE_APPROVED",
      "WARNING",
      ipAddress,
      "expenses",
      expenseId,
      { status: "PENDING" },
      { status: "APPROVED", verified_total: data.total_amount },
    );

    return { message: "Expense securely verified and posted to ledgers." };
  }

  static async rejectExpense(
    expenseId,
    reason,
    category,
    branchId,
    managerId,
    ipAddress,
  ) {
    const rejected = await Expense.reject(expenseId, reason, category);

    await logSecureAction(
      managerId,
      branchId,
      "OCR_EXPENSE_REJECTED",
      "INFO",
      ipAddress,
      "expenses",
      expenseId,
      { status: "PENDING" },
      { status: "REJECTED", reason, category },
    );

    return rejected;
  }
}

module.exports = ExpenseService;
