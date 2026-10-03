const { query } = require("../config/db");

class CashFlowStatement {
  static async getCashFlowData(branchId, startDate, endDate) {
    // 1. Retrieve the System-Defined Liquid Accounts
    const sysRes = await query(
      `SELECT cash_on_hand_account_id, digital_payment_account_id FROM system_settings WHERE id = 1`,
    );
    const sys = sysRes.rows[0] || {};
    const liquidAccounts = [
      sys.cash_on_hand_account_id,
      sys.digital_payment_account_id,
    ].filter(Boolean);

    // If no cash accounts exist in system settings, return empty
    if (liquidAccounts.length === 0) {
      return { opening_balance: 0, transactions: [] };
    }

    const liquidIdsCsv = liquidAccounts.join(",");
    const branchFilter = `($1::int IS NULL OR branch_id = $1::int)`;

    // -------------------------------------------------------------
    // ENGINE A: Compute Absolute Opening Balance (Cumulative to Start Date)
    // -------------------------------------------------------------
    const openingSql = `
      WITH OpeningTransactions AS (
        SELECT amount_received as debit, 0 as credit FROM payments WHERE status != 'VOID' AND ${branchFilter} AND payment_date < $2::date
        UNION ALL
        SELECT 0 as debit, amount_paid as credit FROM vendor_payments WHERE status != 'VOID' AND ${branchFilter} AND payment_date < $2::date
        UNION ALL
        SELECT 0 as debit, total_amount as credit FROM expenses WHERE status = 'APPROVED' AND ${branchFilter} AND expense_date < $2::date
        UNION ALL
        SELECT 
          CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END as debit,
          CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END as credit
        FROM journal_entry_items ji 
        JOIN journal_entries je ON ji.journal_entry_id = je.id
        WHERE je.status = 'POSTED' AND ji.account_id IN (${liquidIdsCsv}) AND ${branchFilter.replace(/branch_id/g, "je.branch_id")} AND je.entry_date < $2::date
      )
      SELECT COALESCE(SUM(debit) - SUM(credit), 0) as opening_balance FROM OpeningTransactions
    `;
    const openingRes = await query(openingSql, [branchId, startDate]);
    const openingBalance = parseFloat(openingRes.rows[0].opening_balance);

    // -------------------------------------------------------------
    // ENGINE B: Direct Method Classification of Period Cash Flows
    // -------------------------------------------------------------
    const periodSql = `
      -- 1. OPERATING INFLOWS (Customer Collections)
      SELECT 'OPERATING' as activity_type, 'Customer Payments (A/R Collection)' as description, amount_received as net_amount
      FROM payments WHERE status != 'VOID' AND ${branchFilter} AND payment_date BETWEEN $2::date AND $3::date

      UNION ALL

      -- 2. OPERATING OUTFLOWS (Supplier Disbursements)
      SELECT 'OPERATING' as activity_type, 'Supplier Payments (A/P Liquidation)' as description, -amount_paid as net_amount
      FROM vendor_payments WHERE status != 'VOID' AND ${branchFilter} AND payment_date BETWEEN $2::date AND $3::date

      UNION ALL

      -- 3. OPERATING OUTFLOWS (Operational & OCR Expenses)
      SELECT 'OPERATING' as activity_type, 
             CASE WHEN scan_id IS NOT NULL THEN 'OCR Verified Operating Expenses' ELSE 'Manual Operating Expenses' END as description, 
             -total_amount as net_amount
      FROM expenses WHERE status = 'APPROVED' AND ${branchFilter} AND expense_date BETWEEN $2::date AND $3::date

      UNION ALL

      -- 4. INVESTING & FINANCING (Manual Journal Entries)
      -- Automatically classifies based on the Contra-Account type and explicitly excludes internal Cash-to-Bank transfers
      SELECT * FROM (
        SELECT
          CASE
            WHEN c.account_type = 'ASSET' THEN 'INVESTING'
            WHEN c.account_type IN ('LIABILITY', 'EQUITY') THEN 'FINANCING'
            ELSE 'OPERATING'
          END as activity_type,
          COALESCE(je.description, 'Manual Journal Adjustment') as description,
          (SELECT SUM(CASE WHEN entry_type='DEBIT' THEN amount ELSE -amount END)
           FROM journal_entry_items WHERE journal_entry_id = je.id AND account_id IN (${liquidIdsCsv})
          ) as net_amount
        FROM journal_entries je
        LEFT JOIN LATERAL (
          SELECT coa.account_type
          FROM journal_entry_items ji
          JOIN chart_of_accounts coa ON ji.account_id = coa.id
          WHERE ji.journal_entry_id = je.id AND ji.account_id NOT IN (${liquidIdsCsv})
          ORDER BY ji.amount DESC LIMIT 1
        ) c ON true
        WHERE je.status = 'POSTED'
          AND EXISTS (SELECT 1 FROM journal_entry_items WHERE journal_entry_id = je.id AND account_id IN (${liquidIdsCsv}))
          AND ${branchFilter.replace(/branch_id/g, "je.branch_id")}
          AND je.entry_date BETWEEN $2::date AND $3::date
      ) t WHERE net_amount != 0 -- This safely filters out internal cash transfers
    `;

    const values = [branchId, startDate, endDate];
    const periodRes = await query(periodSql, values);

    return { opening_balance: openingBalance, transactions: periodRes.rows };
  }
}

module.exports = CashFlowStatement;
