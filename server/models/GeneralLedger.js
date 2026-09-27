const { query } = require("../config/db");

class GeneralLedger {
  static async getBaseLedgerQuery(accountId) {
    const sysRes = await query(`SELECT * FROM system_settings WHERE id = 1`);
    const sys = sysRes.rows[0] || {};
    const targetId = parseInt(accountId, 10);
    const queries = [];

    const branchFilter = `($2::int IS NULL OR branch_id = $2::int)`;

    // Accounts Receivable (AR)
    if (targetId === sys.ar_account_id) {
      queries.push(
        `SELECT 'INVOICE' as source_type, id as source_id, invoice_number as reference_number, created_at::date as transaction_date, created_at, grand_total as debit, 0 as credit, branch_id, 'Customer Invoice' as description FROM invoices WHERE status != 'VOID' AND ${branchFilter}`,
      );
      queries.push(
        `SELECT 'PAYMENT' as source_type, id as source_id, payment_number as reference_number, payment_date as transaction_date, created_at, 0 as debit, amount_received as credit, branch_id, 'Customer Payment Received' as description FROM payments WHERE status != 'VOID' AND ${branchFilter}`,
      );
    }

    // Accounts Payable (AP)
    if (targetId === sys.ap_account_id) {
      queries.push(
        `SELECT 'BILL' as source_type, id as source_id, vendor_invoice_number as reference_number, bill_date as transaction_date, created_at, 0 as debit, grand_total as credit, branch_id, 'Supplier Bill' as description FROM bills WHERE ${branchFilter}`,
      );
      queries.push(
        `SELECT 'VENDOR_PAYMENT' as source_type, id as source_id, payment_number as reference_number, payment_date as transaction_date, created_at, amount_paid as debit, 0 as credit, branch_id, 'Vendor Payment Disbursed' as description FROM vendor_payments WHERE status != 'VOID' AND ${branchFilter}`,
      );
    }

    // Cash on Hand
    if (targetId === sys.cash_on_hand_account_id) {
      queries.push(
        `SELECT 'PAYMENT' as source_type, id as source_id, payment_number as reference_number, payment_date as transaction_date, created_at, amount_received as debit, 0 as credit, branch_id, 'Cash Collection' as description FROM payments WHERE payment_method = 'CASH' AND status != 'VOID' AND ${branchFilter}`,
      );
      queries.push(
        `SELECT 'VENDOR_PAYMENT' as source_type, id as source_id, payment_number as reference_number, payment_date as transaction_date, created_at, 0 as debit, amount_paid as credit, branch_id, 'Cash Disbursement' as description FROM vendor_payments WHERE payment_method = 'CASH' AND status != 'VOID' AND ${branchFilter}`,
      );
      queries.push(
        `SELECT 'EXPENSE' as source_type, id as source_id, expense_number as reference_number, expense_date as transaction_date, created_at, 0 as debit, total_amount as credit, branch_id, description FROM expenses WHERE payment_method IN ('CASH', 'PETTY_CASH') AND status = 'APPROVED' AND ${branchFilter}`,
      );
    }

    // Digital Payments / Bank
    if (targetId === sys.digital_payment_account_id) {
      queries.push(
        `SELECT 'PAYMENT' as source_type, id as source_id, payment_number as reference_number, payment_date as transaction_date, created_at, amount_received as debit, 0 as credit, branch_id, 'Digital Collection' as description FROM payments WHERE payment_method IN ('GCASH', 'MAYA', 'BANK_TRANSFER') AND status != 'VOID' AND ${branchFilter}`,
      );
      queries.push(
        `SELECT 'VENDOR_PAYMENT' as source_type, id as source_id, payment_number as reference_number, payment_date as transaction_date, created_at, 0 as debit, amount_paid as credit, branch_id, 'Digital Disbursement' as description FROM vendor_payments WHERE payment_method IN ('CHECK', 'GCASH', 'MAYA', 'BANK_TRANSFER') AND status != 'VOID' AND ${branchFilter}`,
      );
      queries.push(
        `SELECT 'EXPENSE' as source_type, id as source_id, expense_number as reference_number, expense_date as transaction_date, created_at, 0 as debit, total_amount as credit, branch_id, description FROM expenses WHERE payment_method IN ('GCASH', 'MAYA', 'BANK_TRANSFER', 'CHECK') AND status = 'APPROVED' AND ${branchFilter}`,
      );
    }

    // Output VAT
    if (targetId === sys.output_vat_account_id) {
      queries.push(
        `SELECT 'INVOICE' as source_type, id as source_id, invoice_number as reference_number, created_at::date as transaction_date, created_at, 0 as debit, vat_amount as credit, branch_id, 'Output VAT on Sales' as description FROM invoices WHERE vat_amount > 0 AND status != 'VOID' AND ${branchFilter}`,
      );
    }

    // Input VAT
    if (targetId === sys.input_vat_account_id) {
      queries.push(
        `SELECT 'BILL' as source_type, id as source_id, vendor_invoice_number as reference_number, bill_date as transaction_date, created_at, vat_amount as debit, 0 as credit, branch_id, 'Input VAT on Purchases' as description FROM bills WHERE vat_amount > 0 AND ${branchFilter}`,
      );
      queries.push(
        `SELECT 'EXPENSE' as source_type, id as source_id, expense_number as reference_number, expense_date as transaction_date, created_at, vat_amount as debit, 0 as credit, branch_id, description FROM expenses WHERE vat_amount > 0 AND status = 'APPROVED' AND ${branchFilter}`,
      );
    }

    // Income Accounts (Service & Parts Revenue)
    queries.push(`
      SELECT 'INVOICE' as source_type, i.id as source_id, i.invoice_number as reference_number, i.created_at::date as transaction_date, i.created_at, 0 as debit, SUM(ii.recorded_selling_price * ii.quantity - ii.discount_amount) as credit, i.branch_id, 'Service Revenue' as description
      FROM invoices i JOIN invoice_items ii ON i.id = ii.invoice_id JOIN services s ON ii.service_id = s.id
      WHERE s.income_account_id = $1 AND i.status != 'VOID' AND ($2::int IS NULL OR i.branch_id = $2::int)
      GROUP BY i.id, i.invoice_number, i.created_at, i.branch_id
    `);
    queries.push(`
      SELECT 'INVOICE' as source_type, i.id as source_id, i.invoice_number as reference_number, i.created_at::date as transaction_date, i.created_at, 0 as debit, SUM(ii.recorded_selling_price * ii.quantity - ii.discount_amount) as credit, i.branch_id, 'Parts Revenue' as description
      FROM invoices i JOIN invoice_items ii ON i.id = ii.invoice_id JOIN inventory_items inv ON ii.item_id = inv.id
      WHERE ii.line_type = 'PART' AND inv.income_account_id = $1 AND i.status != 'VOID' AND ($2::int IS NULL OR i.branch_id = $2::int)
      GROUP BY i.id, i.invoice_number, i.created_at, i.branch_id
    `);

    // Expense Accounts (Manual and OCR)
    queries.push(`
      SELECT 'EXPENSE' as source_type, id as source_id, expense_number as reference_number, expense_date as transaction_date, created_at, subtotal as debit, 0 as credit, branch_id, description
      FROM expenses WHERE expense_account_id = $1 AND status = 'APPROVED' AND ${branchFilter}
    `);

    // Inventory Asset Accounts
    queries.push(`
      SELECT 'INVENTORY_MOVEMENT' as source_type, im.id as source_id, im.transaction_reference as reference_number, im.created_at::date as transaction_date, im.created_at, 
      (im.quantity_added * im.recorded_unit_cost) as debit, (im.quantity_deducted * im.recorded_unit_cost) as credit, im.branch_id, im.remarks as description
      FROM inventory_movements im JOIN inventory_items inv ON im.item_id = inv.id
      WHERE inv.asset_account_id = $1 AND ($2::int IS NULL OR im.branch_id = $2::int)
    `);

    // Inventory Adjustments (Shrinkage/Gain Expenses)
    queries.push(`
      SELECT 'INVENTORY_ADJUSTMENT' as source_type, im.id as source_id, im.transaction_reference as reference_number, im.created_at::date as transaction_date, im.created_at, 
      (im.quantity_deducted * im.recorded_unit_cost) as debit, (im.quantity_added * im.recorded_unit_cost) as credit, im.branch_id, COALESCE(im.adjustment_reason::text, im.remarks) as description
      FROM inventory_movements im JOIN inventory_items inv ON im.item_id = inv.id
      WHERE im.transaction_type = 'MANUAL_ADJUSTMENT' AND inv.expense_account_id = $1 AND ($2::int IS NULL OR im.branch_id = $2::int)
    `);

    //  Manual Journal Entries
    queries.push(`
      SELECT 'JOURNAL_ENTRY' as source_type, je.id as source_id, je.journal_number as reference_number, je.entry_date as transaction_date, je.created_at,
      CASE WHEN ji.entry_type = 'DEBIT' THEN ji.amount ELSE 0 END as debit,
      CASE WHEN ji.entry_type = 'CREDIT' THEN ji.amount ELSE 0 END as credit,
      je.branch_id, COALESCE(ji.line_description, je.description) as description
      FROM journal_entry_items ji JOIN journal_entries je ON ji.journal_entry_id = je.id
      WHERE ji.account_id = $1 AND je.status = 'POSTED' AND ($2::int IS NULL OR je.branch_id = $2::int)
    `);

    return queries.join("\n UNION ALL \n");
  }

  static async getLedgerData(
    accountId,
    branchId,
    startDate,
    endDate,
    search,
    limit,
    offset,
  ) {
    const baseQuery = await this.getBaseLedgerQuery(accountId);

    let sql = `
      WITH BaseLedger AS (
        ${baseQuery}
      ),
      DateCappedLedger AS (
        SELECT bl.*, b.branch_name 
        FROM BaseLedger bl
        LEFT JOIN branches b ON bl.branch_id = b.id
        WHERE ($4::date IS NULL OR bl.transaction_date <= $4::date)
      ),
      WithRunningTotals AS (
        SELECT *, 
          SUM(debit - credit) OVER (ORDER BY transaction_date ASC, created_at ASC, source_id ASC) as raw_running_balance
        FROM DateCappedLedger
      ),
      SearchFiltered AS (
        SELECT * FROM WithRunningTotals
        WHERE ($3::text IS NULL OR reference_number ILIKE $3 OR description ILIKE $3)
          AND ($5::date IS NULL OR transaction_date >= $5::date)
      )
      SELECT *, 
             COUNT(*) OVER() as total_filtered_count,
             SUM(debit) OVER() as total_period_debit,
             SUM(credit) OVER() as total_period_credit 
      FROM SearchFiltered 
      ORDER BY transaction_date ASC, created_at ASC 
      LIMIT $6 OFFSET $7;
    `;

    const searchParam = search ? `%${search}%` : null;

    const values = [
      accountId,
      branchId || null,
      searchParam,
      endDate || null,
      startDate || null,
      limit,
      offset,
    ];

    const result = await query(sql, values);

    const totalCount =
      result.rows.length > 0
        ? parseInt(result.rows[0].total_filtered_count, 10)
        : 0;
    const periodDebit =
      result.rows.length > 0
        ? parseFloat(result.rows[0].total_period_debit)
        : 0;
    const periodCredit =
      result.rows.length > 0
        ? parseFloat(result.rows[0].total_period_credit)
        : 0;

    const transactions = result.rows.map((row) => {
      delete row.total_filtered_count;
      delete row.total_period_debit;
      delete row.total_period_credit;
      return row;
    });

    return { transactions, totalCount, periodDebit, periodCredit };
  }

  static async getOpeningBalance(accountId, branchId, startDate) {
    if (!startDate) return { total_debit: 0, total_credit: 0 };

    const baseQuery = await this.getBaseLedgerQuery(accountId);

    const sql = `
      WITH BaseLedger AS (
        ${baseQuery}
      )
      SELECT COALESCE(SUM(debit), 0) as total_debit, COALESCE(SUM(credit), 0) as total_credit
      FROM BaseLedger
      WHERE transaction_date < $3::date
    `;

    const result = await query(sql, [accountId, branchId || null, startDate]);
    return result.rows[0];
  }
}

module.exports = GeneralLedger;
