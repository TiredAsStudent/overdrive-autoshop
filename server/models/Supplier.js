const { query } = require("../config/db");

class Supplier {
  static async getActive() {
    const sql = `
      SELECT id, supplier_name, tin 
      FROM suppliers 
      WHERE is_active = TRUE
      ORDER BY supplier_name ASC
    `;
    const result = await query(sql);
    return result.rows;
  }

  static async create(data) {
    const sql = `
      INSERT INTO suppliers (supplier_name, tin, contact_info, contact_person, email, address, is_vat_registered) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *;
    `;
    const values = [
      data.supplier_name,
      data.tin,
      data.contact_info,
      data.contact_person,
      data.email,
      data.address,
      data.is_vat_registered,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `SELECT * FROM suppliers WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const sql = `
      UPDATE suppliers 
      SET 
        supplier_name = COALESCE($1, supplier_name),
        tin = COALESCE($2, tin),
        contact_info = COALESCE($3, contact_info),
        contact_person = COALESCE($4, contact_person),
        email = COALESCE($5, email),
        address = COALESCE($6, address),
        is_vat_registered = COALESCE($7, is_vat_registered),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
      WHERE id = $9 RETURNING *;
    `;
    const values = [
      data.supplier_name,
      data.tin,
      data.contact_info,
      data.contact_person,
      data.email,
      data.address,
      data.is_vat_registered,
      data.is_active,
      id,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  // The Ledger Aggregator: Joins Suppliers with Expenses to get real-time totals
  static async getLedgerSummary(showArchived = false) {
    const sql = `
      SELECT 
        s.*,
        COALESCE(SUM(e.total_amount) FILTER (WHERE e.status = 'APPROVED'), 0) AS lifetime_purchases,
        COALESCE(SUM(e.total_amount) FILTER (WHERE e.status = 'PENDING'), 0) AS pending_purchases,
        COUNT(e.id) AS total_transaction_count
      FROM suppliers s
      LEFT JOIN expenses e ON s.id = e.supplier_id
      WHERE ($1::boolean = TRUE OR s.is_active = TRUE)
      GROUP BY s.id
      ORDER BY s.is_active DESC, lifetime_purchases DESC, s.supplier_name ASC
    `;
    const result = await query(sql, [showArchived]);
    return result.rows;
  }

  // The Timeline Drawer: Gets chronological history for a single vendor
  static async getTransactionTimeline(supplierId) {
    const sql = `
      SELECT 
        id as transaction_id, transaction_date, base_amount, vat_amount, total_amount, 
        status, receipt_image_url, created_at, 'OCR_PURCHASE' as transaction_type
      FROM expenses
      WHERE supplier_id = $1
      ORDER BY transaction_date DESC, created_at DESC
    `;
    const result = await query(sql, [supplierId]);
    return result.rows;
  }
}

module.exports = Supplier;
