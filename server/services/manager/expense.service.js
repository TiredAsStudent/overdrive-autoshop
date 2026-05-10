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

    // Execute Atomic Query and extract the exact General Ledger ID
    const { gl_transaction_id } = await Expense.approveAtomic(
      expenseId,
      data,
      branchId,
    );

    // Write to the Audit Trail linking directly to the General Ledger
    await logSecureAction(
      managerId,
      branchId,
      "OCR_EXPENSE_APPROVED",
      "WARNING",
      ipAddress,
      "general_ledger", // Target Resource: Now accurate
      gl_transaction_id, // Target ID: Direct link to the GL entry
      { status: "PENDING", source_expense_id: expenseId },
      {
        status: "APPROVED",
        verified_total: data.total_amount,
        payment_method: data.payment_method,
        expense_account: data.expense_account_id,
      },
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
