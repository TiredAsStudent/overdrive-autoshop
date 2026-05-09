const Expense = require("../../models/Expense");
const SystemSetting = require("../../models/SystemSetting");
const { logSecureAction } = require("../../utils/auditLogger");

class StaffExpenseService {
  /**
   * Finalizes the submission after the Staff completes the Split-Screen Review
   * Works for both AI-Assisted (Mode A) and Manual/Payroll (Mode B)
   */
  static async submitPendingExpense(data, staffId, branchId, ipAddress) {
    // 1. Fetch the Dynamic VAT Rate from Global Settings
    const settings = await SystemSetting.getSettings();
    const vatRate = parseFloat(settings.vat_percentage) / 100; // e.g., 12 becomes 0.12

    // 2. Auto-Calculate VAT using the dynamic rate
    let finalVat = data.vat_amount || 0;
    if (finalVat === 0 && data.total_amount > 0 && data.apply_standard_vat) {
      // Dynamic Formula: (Total / (1 + Rate)) * Rate
      finalVat = (data.total_amount / (1 + vatRate)) * vatRate;
    }

    const baseAmount = data.total_amount - finalVat;

    // 3. Prepare the data object for the Model
    const expenseData = {
      branch_id: branchId,
      submitted_by: staffId,
      supplier_id: data.supplier_id || null,
      transaction_date: data.transaction_date,
      base_amount: baseAmount.toFixed(2),
      vat_amount: finalVat.toFixed(2),
      total_amount: data.total_amount.toFixed(2),
      receipt_image_url: data.receipt_image_url,
      ai_confidence_score: data.confidence_score || 1.0,
    };

    // 4. Call the Model to execute the strict SQL
    const newExpense = await Expense.create(expenseData);

    // 5. Log the creation in the Audit Trail
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
