const Expense = require("../../models/Expense");
const { logSecureAction } = require("../../utils/auditLogger");

class StaffExpenseService {
  /**
   * Finalizes the submission after the Staff completes the Split-Screen Review
   * Works for both AI-Assisted (Mode A) and Manual/Payroll (Mode B)
   */
  static async submitPendingExpense(data, staffId, branchId, ipAddress) {
    // 1. Auto-Calculate VAT if only the total was provided (Capstone Requirement)
    let finalVat = data.vat_amount || 0;
    if (finalVat === 0 && data.total_amount > 0 && data.apply_standard_vat) {
      // Back-calculate 12% VAT from a VAT-inclusive total
      finalVat = (data.total_amount / 1.12) * 0.12;
    }

    const baseAmount = data.total_amount - finalVat;

    // 2. Prepare the data object for the Model
    const expenseData = {
      branch_id: branchId, // Forcefully injected from Auth Token (Branch-Lock)
      submitted_by: staffId,
      supplier_id: data.supplier_id || null, // Nullable for new vendors or payroll
      transaction_date: data.transaction_date,
      base_amount: baseAmount.toFixed(2),
      vat_amount: finalVat.toFixed(2),
      total_amount: data.total_amount.toFixed(2),
      receipt_image_url: data.receipt_image_url,
      ai_confidence_score: data.confidence_score || 1.0, // Manual defaults to 100%
    };

    // 3. Call the Model to execute the strict SQL (True MVC Pattern)
    const newExpense = await Expense.create(expenseData);

    // 4. Log the creation in the Audit Trail
    await logSecureAction(
      staffId,
      branchId,
      "STAFF_SUBMITTED_EXPENSE",
      "INFO",
      ipAddress,
      "expenses",
      newExpense.id,
      null,
      { status: "PENDING", total: newExpense.total_amount },
    );

    return newExpense;
  }
}

module.exports = StaffExpenseService;
