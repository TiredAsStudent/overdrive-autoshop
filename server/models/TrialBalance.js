const { query } = require("../config/db");

class TrialBalance {
  static async getAggregatedBalances(branchId, endDate) {
    const sysRes = await query(`SELECT * FROM system_settings WHERE id = 1`);
    const sys = sysRes.rows[0] || {};

    const branchFilter = `($1::int IS NULL OR branch_id = $1::int)`;

    // Strict 'As Of Date' cutoff (Cumulative from inception)
    const dateFilter = (dateCol) =>
      `($2::date IS NULL OR ${dateCol} <= $2::date)`;

    const queries = [];

    // --- AR & AP Control Accounts ---
    if (sys.ar_account_id) {
      queries.push(
        `SELECT ${sys.ar_account_id} as account_id, grand_total as debit, 0 as credit FROM invoices WHERE status != 'VOID' AND ${branchFilter} AND ${dateFilter("created_at::date")}`,
      );
      queries.push(
        `SELECT ${sys.ar_account_id} as account_id, 0 as debit, amount_received as credit FROM payments WHERE status != 'VOID' AND ${branchFilter} AND ${dateFilter("payment_date")}`,
      );
    }
    if (sys.ap_account_id) {
      queries.push(
        `SELECT ${sys.ap_account_id} as account_id, 0 as debit, grand_total as credit FROM bills WHERE ${branchFilter} AND ${dateFilter("bill_date")}`,
      );
      queries.push(
        `SELECT ${sys.ap_account_id} as account_id, amount_paid as debit, 0 as credit FROM vendor_payments WHERE status != 'VOID' AND ${branchFilter} AND ${dateFilter("payment_date")}`,
      );
    }

    // --- Liquid Accounts (Cash & Digital) ---
    if (sys.cash_on_hand_account_id) {
      queries.push(
        `SELECT ${sys.cash_on_hand_account_id} as account_id, amount_received as debit, 0 as credit FROM payments WHERE payment_method = 'CASH' AND status != 'VOID' AND ${branchFilter} AND ${dateFilter("payment_date")}`,
      );
      queries.push(
        `SELECT ${sys.cash_on_hand_account_id} as account_id, 0 as debit, amount_paid as credit FROM vendor_payments WHERE payment_method = 'CASH' AND status != 'VOID' AND ${branchFilter} AND ${dateFilter("payment_date")}`,
      );
      queries.push(
        `SELECT ${sys.cash_on_hand_account_id} as account_id, 0 as debit, total_amount as credit FROM expenses WHERE payment_method IN ('CASH', 'PETTY_CASH') AND status = 'APPROVED' AND ${branchFilter} AND ${dateFilter("expense_date")}`,
      );
    }
    if (sys.digital_payment_account_id) {
      queries.push(
        `SELECT ${sys.digital_payment_account_id} as account_id, amount_received as debit, 0 as credit FROM payments WHERE payment_method IN ('GCASH', 'MAYA', 'BANK_TRANSFER') AND status != 'VOID' AND ${branchFilter} AND ${dateFilter("payment_date")}`,
      );
      queries.push(
        `SELECT ${sys.digital_payment_account_id} as account_id, 0 as debit, amount_paid as credit FROM vendor_payments WHERE payment_method IN ('CHECK', 'GCASH', 'MAYA', 'BANK_TRANSFER') AND status != 'VOID' AND ${branchFilter} AND ${dateFilter("payment_date")}`,
      );
      queries.push(
        `SELECT ${sys.digital_payment_account_id} as account_id, 0 as debit, total_amount as credit FROM expenses WHERE payment_method IN ('GCASH', 'MAYA', 'BANK_TRANSFER', 'CHECK') AND status = 'APPROVED' AND ${branchFilter} AND ${dateFilter("expense_date")}`,
      );
    }

    // --- Tax Control Accounts ---
    if (sys.output_vat_account_id) {
      queries.push(
        `SELECT ${sys.output_vat_account_id} as account_id, 0 as debit, vat_amount as credit FROM invoices WHERE vat_amount > 0 AND status != 'VOID' AND ${branchFilter} AND ${dateFilter("created_at::date")}`,
      );
    }
    if (sys.input_vat_account_id) {
      queries.push(
        `SELECT ${sys.input_vat_account_id} as account_id, vat_amount as debit, 0 as credit FROM bills WHERE vat_amount > 0 AND ${branchFilter} AND ${dateFilter("bill_date")}`,
      );
      queries.push(
        `SELECT ${sys.input_vat_account_id} as account_id, vat_amount as debit, 0 as credit FROM expenses WHERE vat_amount > 0 AND status = 'APPROVED' AND ${branchFilter} AND ${dateFilter("expense_date")}`,
      );
    }

    // --- Dynamic Chart of Accounts Mappings ---
    queries.push(`
      SELECT s.income_account_id as account_id, 0 as debit, SUM(ii.recorded_selling_price * ii.quantity - ii.discount_amount) as credit
      FROM invoices i JOIN invoice_items ii ON i.id = ii.invoice_id JOIN services s ON ii.service_id = s.id
      WHERE i.status != 'VOID' AND ${branchFilter.replace(/branch_id/g, "i.branch_id")} AND ${dateFilter("i.created_at::date")}
      GROUP BY s.income_account_id
    `);

    queries.push(`
      SELECT inv.income_account_id as account_id, 0 as debit, SUM(ii.recorded_selling_price * ii.quantity - ii.discount_amount) as credit
      FROM invoices i JOIN invoice_items ii ON i.id = ii.invoice_id JOIN inventory_items inv ON ii.item_id = inv.id
      WHERE ii.line_type = 'PART' AND i.status != 'VOID' AND ${branchFilter.replace(/branch_id/g, "i.branch_id")} AND ${dateFilter("i.created_at::date")}
      GROUP BY inv.income_account_id
    `);

    queries.push(
      `SELECT expense_account_id as account_id, subtotal as debit, 0 as credit FROM expenses WHERE status = 'APPROVED' AND ${branchFilter} AND ${dateFilter("expense_date")}`,
    );

    queries.push(`
      SELECT inv.asset_account_id as account_id, (im.quantity_added * im.recorded_unit_cost) as debit, (im.quantity_deducted * im.recorded_unit_cost) as credit
      FROM inventory_movements im JOIN inventory_items inv ON im.item_id = inv.id
      WHERE ${branchFilter.replace(/branch_id/g, "im.branch_id")} AND ${dateFilter("im.created_at::date")}
    `);

    queries.push(`
      SELECT inv.expense_account_id as account_id, (im.quantity_deducted * im.recorded_unit_cost) as debit, (im.quantity_added * im.recorded_unit_cost) as credit
      FROM inventory_movements im JOIN inventory_items inv ON im.item_id = inv.id
      WHERE im.transaction_type IN ('MANUAL_ADJUSTMENT', 'SALES_INVOICE') AND ${branchFilter.replace(/branch_id/g, "im.branch_id")} AND ${dateFilter("im.created_at::date")}
    `);

    queries.push(`
      SELECT ji.account_id, CASE WHEN ji.entry_type = 'DEBIT' THEN ji.amount ELSE 0 END as debit, CASE WHEN ji.entry_type = 'CREDIT' THEN ji.amount ELSE 0 END as credit
      FROM journal_entry_items ji JOIN journal_entries je ON ji.journal_entry_id = je.id
      WHERE je.status = 'POSTED' AND ${branchFilter.replace(/branch_id/g, "je.branch_id")} AND ${dateFilter("je.entry_date")}
    `);

    const sql = `
      WITH AllTransactions AS (
        ${queries.join("\n UNION ALL \n")}
      )
      SELECT 
        c.id, c.account_code, c.account_name, c.account_type,
        COALESCE(SUM(t.debit), 0) as raw_debit_total,
        COALESCE(SUM(t.credit), 0) as raw_credit_total
      FROM chart_of_accounts c
      LEFT JOIN AllTransactions t ON c.id = t.account_id
      GROUP BY c.id, c.account_code, c.account_name, c.account_type
      ORDER BY c.account_code ASC
    `;

    const values = [branchId ? parseInt(branchId, 10) : null, endDate || null];

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = TrialBalance;
