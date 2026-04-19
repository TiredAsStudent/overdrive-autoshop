const { query } = require("../config/db");

class Branch {
  static async create(data) {
    const sql = `
      INSERT INTO branches (
        branch_name, branch_code, location, address, tin, 
        contact_number, contact_email, invoice_header, invoice_footer
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `;
    const values = [
      data.branch_name,
      data.branch_code,
      data.location,
      data.address,
      data.tin,
      data.contact_number,
      data.contact_email,
      data.invoice_header,
      data.invoice_footer,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async findAll() {
    const sql = `SELECT * FROM branches WHERE is_active = TRUE ORDER BY id ASC`;
    const result = await query(sql);
    return result.rows;
  }

  static async findById(id) {
    const sql = `SELECT * FROM branches WHERE id = $1 AND is_active = TRUE`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findByCode(branchCode) {
    const sql = `SELECT * FROM branches WHERE branch_code = $1 AND is_active = TRUE`;
    const result = await query(sql, [branchCode]);
    return result.rows[0];
  }

  static async update(id, data) {
    const sql = `
      UPDATE branches 
      SET 
        branch_name = COALESCE($1, branch_name),
        branch_code = COALESCE($2, branch_code),
        location = COALESCE($3, location),
        address = COALESCE($4, address),
        tin = COALESCE($5, tin),
        contact_number = COALESCE($6, contact_number),
        contact_email = COALESCE($7, contact_email),
        invoice_header = COALESCE($8, invoice_header),
        invoice_footer = COALESCE($9, invoice_footer),
        is_active = COALESCE($10, is_active),
        updated_at = NOW()
      WHERE id = $11 AND is_active = TRUE
      RETURNING *
    `;
    const values = [
      data.branch_name,
      data.branch_code,
      data.location,
      data.address,
      data.tin,
      data.contact_number,
      data.contact_email,
      data.invoice_header,
      data.invoice_footer,
      data.is_active,
      id,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async toggleMaintenance(id, isMaintenanceMode) {
    const sql = `
      UPDATE branches 
      SET is_maintenance_mode = $1, updated_at = NOW() 
      WHERE id = $2 AND is_active = TRUE 
      RETURNING id, branch_name, is_maintenance_mode
    `;
    const result = await query(sql, [isMaintenanceMode, id]);
    return result.rows[0];
  }

  static async softDelete(id) {
    const sql = `
      UPDATE branches 
      SET is_active = FALSE, updated_at = NOW() 
      WHERE id = $1 
      RETURNING id
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }
}

module.exports = Branch;
