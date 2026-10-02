const { query } = require("../config/db");

class IncomeStatement {
  static async getDynamicCOGSAccountIds() {
    const sql = `SELECT DISTINCT expense_account_id FROM inventory_items WHERE expense_account_id IS NOT NULL`;
    const result = await query(sql);
    return result.rows.map((row) => row.expense_account_id);
  }

  static async getAggregatedPnL(branchId, startDate, endDate) {
    const branchFilter = `($1::int IS NULL OR branch_id = $1::int)`;

    const dateFilter = (dateCol) =>
      `(${dateCol} >= $2::date AND ${dateCol} <= $3::date)`;

    const queries = [];

    // --- Service Revenue ---
    queries.push(`
      SELECT s.income_account_id as account_id, 0 as debit, SUM(ii.recorded_selling_price * ii.quantity - ii.discount_amount) as credit
      FROM invoices i JOIN invoice_items ii ON i.id = ii.invoice_id JOIN services s ON ii.service_id = s.id
      WHERE i.status != 'VOID' AND ${branchFilter.replace(/branch_id/g, "i.branch_id")} AND ${dateFilter("i.created_at::date")}
      GROUP BY s.income_account_id
    `);

    // --- Parts Sales Revenue ---
    queries.push(`
      SELECT inv.income_account_id as account_id, 0 as debit, SUM(ii.recorded_selling_price * ii.quantity - ii.discount_amount) as credit
      FROM invoices i JOIN invoice_items ii ON i.id = ii.invoice_id JOIN inventory_items inv ON ii.item_id = inv.id
      WHERE ii.line_type = 'PART' AND i.status != 'VOID' AND ${branchFilter.replace(/branch_id/g, "i.branch_id")} AND ${dateFilter("i.created_at::date")}
      GROUP BY inv.income_account_id
    `);

    // --- Cost of Goods Sold (Inventory Depletion & Adjustments) ---
    queries.push(`
      SELECT inv.expense_account_id as account_id, (im.quantity_deducted * im.recorded_unit_cost) as debit, (im.quantity_added * im.recorded_unit_cost) as credit
      FROM inventory_movements im JOIN inventory_items inv ON im.item_id = inv.id
      WHERE im.transaction_type IN ('MANUAL_ADJUSTMENT', 'SALES_INVOICE') AND ${branchFilter.replace(/branch_id/g, "im.branch_id")} AND ${dateFilter("im.created_at::date")}
    `);

    // --- Operating Expenses (Manual & OCR) ---
    queries.push(`
      SELECT expense_account_id as account_id, subtotal as debit, 0 as credit 
      FROM expenses 
      WHERE status = 'APPROVED' AND ${branchFilter} AND ${dateFilter("expense_date")}
    `);

    // --- Manual Journal Entries (Adjusting Entries to Nominal Accounts) ---
    queries.push(`
      SELECT ji.account_id, 
             CASE WHEN ji.entry_type = 'DEBIT' THEN ji.amount ELSE 0 END as debit, 
             CASE WHEN ji.entry_type = 'CREDIT' THEN ji.amount ELSE 0 END as credit
      FROM journal_entry_items ji JOIN journal_entries je ON ji.journal_entry_id = je.id
      WHERE je.status = 'POSTED' AND ${branchFilter.replace(/branch_id/g, "je.branch_id")} AND ${dateFilter("je.entry_date")}
    `);

    const sql = `
      WITH PnL_Transactions AS (
        ${queries.join("\n UNION ALL \n")}
      )
      SELECT 
        c.id, c.account_code, c.account_name, c.account_type,
        COALESCE(SUM(t.debit), 0) as raw_debit_total,
        COALESCE(SUM(t.credit), 0) as raw_credit_total
      FROM chart_of_accounts c
      LEFT JOIN PnL_Transactions t ON c.id = t.account_id
      WHERE c.account_type IN ('INCOME', 'EXPENSE')
      GROUP BY c.id, c.account_code, c.account_name, c.account_type
      ORDER BY c.account_code ASC
    `;

    const values = [
      branchId ? parseInt(branchId, 10) : null,
      startDate,
      endDate,
    ];

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = IncomeStatement;
