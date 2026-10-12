const { query } = require("../config/db");

class ExpenseReport {
  /**
   * Generates the Base Unified CTE for all Expense queries
   */
  static getBaseQuery() {
    return `
      WITH RawExpenses AS (
        -- 1. MANUAL EXPENSES (OpEx)
        SELECT 
          'MANUAL_EXPENSE' as source_module, 
          e.id as source_id, 
          e.expense_date as transaction_date, 
          e.expense_number as reference_number,
          coa.id as category_id, 
          coa.account_name as category, 
          e.vendor_id,
          COALESCE(v.business_name, e.vendor_name, 'N/A') as vendor_name,
          e.subtotal as amount, 
          e.status::text as payment_status, 
          e.branch_id
        FROM expenses e 
        JOIN chart_of_accounts coa ON e.expense_account_id = coa.id
        LEFT JOIN vendors v ON e.vendor_id = v.id
        WHERE e.status = 'APPROVED' AND e.scan_id IS NULL

        UNION ALL

        -- 2. OCR RECEIPTS (Verified OpEx)
        SELECT 
          'OCR_RECEIPT' as source_module, 
          e.id as source_id, 
          e.expense_date as transaction_date, 
          e.expense_number as reference_number,
          coa.id as category_id, 
          coa.account_name as category, 
          e.vendor_id,
          COALESCE(v.business_name, e.vendor_name, 'N/A') as vendor_name,
          e.subtotal as amount, 
          e.status::text as payment_status, 
          e.branch_id
        FROM expenses e 
        JOIN chart_of_accounts coa ON e.expense_account_id = coa.id
        LEFT JOIN vendors v ON e.vendor_id = v.id
        WHERE e.status = 'APPROVED' AND e.scan_id IS NOT NULL

        UNION ALL

        -- 3. SUPPLIER BILLS (Inventory mapping to Expense/COGS)
        SELECT 
          'BILL' as source_module, 
          b.id as source_id, 
          b.bill_date as transaction_date, 
          b.bill_number as reference_number,
          coa.id as category_id, 
          coa.account_name as category, 
          b.vendor_id,
          v.business_name as vendor_name,
          -- Net cost calculation strictly for the expense line
          (bi.quantity_received * bi.recorded_unit_cost - bi.discount_amount) as amount, 
          b.payment_status::text as payment_status, 
          b.branch_id
        FROM bills b
        JOIN bill_items bi ON b.id = bi.bill_id
        JOIN inventory_items inv ON bi.item_id = inv.id
        JOIN chart_of_accounts coa ON inv.expense_account_id = coa.id
        JOIN vendors v ON b.vendor_id = v.id
        WHERE b.status IN ('RECEIVED', 'CLOSED')

        UNION ALL

        -- 4. JOURNAL ENTRIES (Manual adjustments mapped to Expense accounts)
        SELECT 
          'JOURNAL_ENTRY' as source_module, 
          je.id as source_id, 
          je.entry_date as transaction_date, 
          je.journal_number as reference_number,
          coa.id as category_id, 
          coa.account_name as category, 
          NULL as vendor_id,
          'N/A (Journal Entry)' as vendor_name,
          -- Normal balance for Expense is Debit. Credits reduce the expense.
          CASE WHEN ji.entry_type = 'DEBIT' THEN ji.amount ELSE -ji.amount END as amount, 
          je.status::text as payment_status, 
          je.branch_id
        FROM journal_entries je
        JOIN journal_entry_items ji ON je.id = ji.journal_entry_id
        JOIN chart_of_accounts coa ON ji.account_id = coa.id
        WHERE je.status = 'POSTED' AND coa.account_type = 'EXPENSE'
      ),
      FilteredExpenses AS (
        SELECT r.*, b.branch_name 
        FROM RawExpenses r
        LEFT JOIN branches b ON r.branch_id = b.id
        WHERE ($1::int IS NULL OR r.branch_id = $1::int)
          AND ($2::date IS NULL OR r.transaction_date >= $2::date)
          AND ($3::date IS NULL OR r.transaction_date <= $3::date)
          AND ($4::int IS NULL OR r.category_id = $4::int)
          AND ($5::int IS NULL OR r.vendor_id = $5::int)
          AND ($6::text IS NULL OR r.source_module = $6::text)
          AND ($7::text IS NULL OR r.reference_number ILIKE $7 OR r.vendor_name ILIKE $7)
      )
    `;
  }

  static buildValues(filters) {
    return [
      filters.branch === "all" ? null : parseInt(filters.branch, 10),
      filters.start_date || null,
      filters.end_date || null,
      filters.category_id === "all" ? null : parseInt(filters.category_id, 10),
      filters.vendor_id === "all" ? null : parseInt(filters.vendor_id, 10),
      filters.source_module === "all" ? null : filters.source_module,
      filters.search ? `%${filters.search}%` : null,
    ];
  }

  static async getCategorySummaries(filters) {
    const baseQuery = this.getBaseQuery();
    const values = this.buildValues(filters);

    const sql = `
      ${baseQuery}
      SELECT 
        category_id,
        category as category_name,
        COUNT(source_id) as transaction_count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM FilteredExpenses
      GROUP BY category_id, category
      HAVING COALESCE(SUM(amount), 0) != 0
      ORDER BY total_amount DESC
    `;

    const result = await query(sql, values);
    return result.rows;
  }

  static async getPaginatedTransactions(filters, limit, offset) {
    const baseQuery = this.getBaseQuery();
    const values = this.buildValues(filters);

    const sql = `
      ${baseQuery}
      SELECT 
        source_module,
        source_id,
        TO_CHAR(transaction_date, 'YYYY-MM-DD') as transaction_date,
        reference_number,
        category,
        vendor_name,
        amount,
        payment_status,
        COALESCE(branch_name, 'Enterprise Global') as branch_name,
        COUNT(*) OVER() as total_filtered_count
      FROM FilteredExpenses
      ORDER BY transaction_date DESC, source_id DESC
      LIMIT $8 OFFSET $9
    `;

    values.push(limit, offset);
    const result = await query(sql, values);

    const totalCount =
      result.rows.length > 0
        ? parseInt(result.rows[0].total_filtered_count, 10)
        : 0;
    const transactions = result.rows.map((row) => {
      delete row.total_filtered_count;
      return row;
    });

    return { transactions, totalCount };
  }
}

module.exports = ExpenseReport;
