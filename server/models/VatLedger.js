const { query } = require("../config/db");

class VatLedger {
  // Fetch detailed transactions for the table
  static async getLedgerEntries(taxPeriod, branchId) {
    let sql = `
      SELECT 
        v.*, 
        b.branch_name, b.branch_code
      FROM vat_ledger v
      JOIN branches b ON v.branch_id = b.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (taxPeriod) {
      sql += ` AND v.tax_period = $${paramIndex}`;
      values.push(taxPeriod);
      paramIndex++;
    }
    if (branchId) {
      sql += ` AND v.branch_id = $${paramIndex}`;
      values.push(branchId);
      paramIndex++;
    }

    sql += ` ORDER BY v.transaction_date DESC, v.created_at DESC`;
    const result = await query(sql, values);
    return result.rows;
  }

  // Calculate the high-level summary cards (Output, Input, Net Payable)
  static async getSummary(taxPeriod, branchId) {
    let sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'OUTPUT' THEN vat_amount ELSE 0 END), 0) AS total_output_vat,
        COALESCE(SUM(CASE WHEN transaction_type = 'INPUT' THEN vat_amount ELSE 0 END), 0) AS total_input_vat,
        COALESCE(SUM(CASE WHEN transaction_type = 'OUTPUT' THEN vat_amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN transaction_type = 'INPUT' THEN vat_amount ELSE 0 END), 0) AS net_vat_payable,
        BOOL_AND(is_closed) as is_period_closed
      FROM vat_ledger
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (taxPeriod) {
      sql += ` AND tax_period = $${paramIndex}`;
      values.push(taxPeriod);
      paramIndex++;
    }
    if (branchId) {
      sql += ` AND branch_id = $${paramIndex}`;
      values.push(branchId);
      paramIndex++;
    }

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Lock the period (Immutable constraint)
  static async closeTaxPeriod(taxPeriod) {
    const sql = `
      UPDATE vat_ledger 
      SET is_closed = TRUE, updated_at = NOW() 
      WHERE tax_period = $1 AND is_closed = FALSE
      RETURNING *
    `;
    const result = await query(sql, [taxPeriod]);
    return result.rows; // Returns updated rows
  }
}

module.exports = VatLedger;
