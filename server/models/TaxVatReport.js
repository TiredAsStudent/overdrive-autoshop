const { query } = require("../config/db");

class TaxVatReport {
  static getBaseQuery() {
    return `
      WITH RawVatTransactions AS (
        -- 1. SALES INVOICES (Output VAT)
        SELECT 
          'SALES' as source_module, 
          i.id as source_id, 
          i.created_at::date as transaction_date, 
          i.invoice_number as reference_number,
          c.full_name as counterparty_name, 
          'OUTPUT' as vat_type,
          i.subtotal as taxable_base, 
          i.vat_amount, 
          i.branch_id, 
          i.status::text
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.status != 'VOID' AND i.vat_amount > 0
          AND ($1::int IS NULL OR i.branch_id = $1::int)
          AND ($2::date IS NULL OR i.created_at::date >= $2::date)
          AND ($3::date IS NULL OR i.created_at::date <= $3::date)

        UNION ALL

        -- 2. SUPPLIER BILLS (Input VAT)
        SELECT 
          'BILLS' as source_module, 
          b.id as source_id, 
          b.bill_date as transaction_date, 
          b.bill_number as reference_number,
          v.business_name as counterparty_name, 
          'INPUT' as vat_type,
          b.subtotal as taxable_base, 
          b.vat_amount, 
          b.branch_id, 
          b.status::text
        FROM bills b
        JOIN vendors v ON b.vendor_id = v.id
        WHERE b.status IN ('RECEIVED', 'CLOSED') AND b.vat_amount > 0
          AND ($1::int IS NULL OR b.branch_id = $1::int)
          AND ($2::date IS NULL OR b.bill_date >= $2::date)
          AND ($3::date IS NULL OR b.bill_date <= $3::date)

        UNION ALL

        -- 3. MANUAL EXPENSES (Input VAT)
        SELECT 
          'MANUAL_EXPENSE' as source_module, 
          e.id as source_id, 
          e.expense_date as transaction_date, 
          e.expense_number as reference_number,
          COALESCE(v.business_name, e.vendor_name, 'N/A') as counterparty_name, 
          'INPUT' as vat_type,
          e.subtotal as taxable_base, 
          e.vat_amount, 
          e.branch_id, 
          e.status::text
        FROM expenses e
        LEFT JOIN vendors v ON e.vendor_id = v.id
        WHERE e.status = 'APPROVED' AND e.scan_id IS NULL AND e.vat_amount > 0
          AND ($1::int IS NULL OR e.branch_id = $1::int)
          AND ($2::date IS NULL OR e.expense_date >= $2::date)
          AND ($3::date IS NULL OR e.expense_date <= $3::date)

        UNION ALL

        -- 4. OCR RECEIPTS (Verified Input VAT)
        SELECT 
          'OCR_RECEIPT' as source_module, 
          e.id as source_id, 
          e.expense_date as transaction_date, 
          e.expense_number as reference_number,
          COALESCE(v.business_name, e.vendor_name, 'N/A') as counterparty_name, 
          'INPUT' as vat_type,
          e.subtotal as taxable_base, 
          e.vat_amount, 
          e.branch_id, 
          e.status::text
        FROM expenses e
        LEFT JOIN vendors v ON e.vendor_id = v.id
        WHERE e.status = 'APPROVED' AND e.scan_id IS NOT NULL AND e.vat_amount > 0
          AND ($1::int IS NULL OR e.branch_id = $1::int)
          AND ($2::date IS NULL OR e.expense_date >= $2::date)
          AND ($3::date IS NULL OR e.expense_date <= $3::date)

        UNION ALL

        -- 5. MANUAL JOURNAL ENTRIES (Direct General Ledger VAT Adjustments)
        SELECT 
          'JOURNAL_ENTRY' as source_module, 
          je.id as source_id, 
          je.entry_date as transaction_date, 
          je.journal_number as reference_number,
          'Manual Tax Adjustment' as counterparty_name, 
          CASE 
            WHEN ji.account_id = ss.output_vat_account_id THEN 'OUTPUT'
            ELSE 'INPUT'
          END as vat_type,
          0 as taxable_base, -- Taxable base is N/A for manual direct GL adjustments
          CASE 
            -- Output VAT (Liability): Credit increases liability, Debit decreases liability.
            WHEN ji.account_id = ss.output_vat_account_id THEN 
              CASE WHEN ji.entry_type = 'CREDIT' THEN ji.amount ELSE -ji.amount END
            -- Input VAT (Asset): Debit increases asset, Credit decreases asset.
            ELSE 
              CASE WHEN ji.entry_type = 'DEBIT' THEN ji.amount ELSE -ji.amount END
          END as vat_amount, 
          je.branch_id, 
          je.status::text
        FROM journal_entries je
        JOIN journal_entry_items ji ON je.id = ji.journal_entry_id
        CROSS JOIN system_settings ss
        WHERE je.status = 'POSTED' 
          AND ss.id = 1
          AND (ss.output_vat_account_id IS NOT NULL OR ss.input_vat_account_id IS NOT NULL)
          AND ji.account_id IN (ss.output_vat_account_id, ss.input_vat_account_id)
          AND ($1::int IS NULL OR je.branch_id = $1::int)
          AND ($2::date IS NULL OR je.entry_date >= $2::date)
          AND ($3::date IS NULL OR je.entry_date <= $3::date)
      ),
      FilteredVat AS (
        SELECT r.*, b.branch_name 
        FROM RawVatTransactions r
        JOIN branches b ON r.branch_id = b.id
        WHERE r.vat_amount != 0 -- Defensively filters out offsetting/zeroed manual journal adjustments
          AND ($4::text IS NULL OR r.source_module = $4::text)
          AND ($5::text IS NULL OR r.reference_number ILIKE $5 OR r.counterparty_name ILIKE $5)
      )
    `;
  }

  static buildValues(filters) {
    return [
      filters.branch === "all" ? null : parseInt(filters.branch, 10),
      filters.start_date || null,
      filters.end_date || null,
      filters.source_module === "all" ? null : filters.source_module,
      filters.search ? `%${filters.search}%` : null,
    ];
  }

  static async getExecutiveKPIs(filters) {
    const baseQuery = this.getBaseQuery();
    const values = this.buildValues(filters);

    const sql = `
      ${baseQuery}
      SELECT 
        COALESCE(SUM(CASE WHEN vat_type = 'OUTPUT' THEN taxable_base ELSE 0 END), 0) as total_taxable_sales,
        COALESCE(SUM(CASE WHEN vat_type = 'OUTPUT' THEN vat_amount ELSE 0 END), 0) as total_output_vat,
        COALESCE(SUM(CASE WHEN vat_type = 'INPUT' THEN taxable_base ELSE 0 END), 0) as total_taxable_purchases,
        COALESCE(SUM(CASE WHEN vat_type = 'INPUT' THEN vat_amount ELSE 0 END), 0) as total_input_vat
      FROM FilteredVat
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async getVATSummaryByModule(filters) {
    const baseQuery = this.getBaseQuery();
    const values = this.buildValues(filters);

    const sql = `
      ${baseQuery}
      SELECT 
        source_module,
        vat_type,
        COUNT(source_id) as transaction_count,
        COALESCE(SUM(taxable_base), 0) as total_taxable_base,
        COALESCE(SUM(vat_amount), 0) as total_vat
      FROM FilteredVat
      GROUP BY source_module, vat_type
      ORDER BY total_vat DESC
    `;
    const result = await query(sql, values);
    return result.rows;
  }

  static async getPaginatedLedger(filters, limit, offset) {
    const baseQuery = this.getBaseQuery();
    const values = this.buildValues(filters);

    const sql = `
      ${baseQuery}
      SELECT 
        source_module,
        source_id,
        TO_CHAR(transaction_date, 'YYYY-MM-DD') as transaction_date,
        reference_number,
        counterparty_name,
        vat_type,
        taxable_base,
        vat_amount,
        status,
        COALESCE(branch_name, 'Enterprise Global') as branch_name,
        COUNT(*) OVER() as total_filtered_count
      FROM FilteredVat
      ORDER BY transaction_date DESC, source_id DESC
      LIMIT $6 OFFSET $7
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

  static async getSystemVatRate() {
    const sql = `SELECT vat_percentage FROM system_settings WHERE id = 1`;
    const result = await query(sql);
    return result.rows[0]?.vat_percentage || 12.0;
  }
}

module.exports = TaxVatReport;
