const Expense = require("../../models/Expense");
const { logSecureAction } = require("../../utils/auditLogger");

class ExpenseService {
  static async getPendingExpenses(branchId) {
    return await Expense.getPending(branchId);
  }

  static async approveExpense(expenseId, data, branchId, managerId, ipAddress) {
    // 1. Capstone Detail: Duplicate Detection
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

    // 2. Execute Atomic Transaction
    await Expense.approveAtomic(expenseId, data, branchId);

    // 3. Log the secure Maker-Checker action
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
    branchId,
    managerId,
    ipAddress,
  ) {
    const rejected = await Expense.reject(expenseId, reason);

    await logSecureAction(
      managerId,
      branchId,
      "OCR_EXPENSE_REJECTED",
      "INFO",
      ipAddress,
      "expenses",
      expenseId,
      { status: "PENDING" },
      { status: "REJECTED", reason },
    );

    return rejected;
  }
}

module.exports = ExpenseService;
