const { query } = require("../config/db");

class Branch {
  static async create(data) {
    const sql = `
      INSERT INTO branches (
        branch_name, branch_code, address, tin, 
        contact_number, contact_email
      ) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
    const values = [
      data.branch_name,
      data.branch_code,
      data.address,
      data.tin,
      data.contact_number,
      data.contact_email,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async findAll() {
    // Orders active branches first, then by ID
    const sql = `SELECT * FROM branches ORDER BY is_active DESC, id ASC`;
    const result = await query(sql);
    return result.rows;
  }

  static async findById(id) {
    const sql = `SELECT * FROM branches WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findByCode(branchCode) {
    const sql = `SELECT * FROM branches WHERE branch_code = $1`;
    const result = await query(sql, [branchCode]);
    return result.rows[0];
  }

  static async update(id, data) {
    const sql = `
      UPDATE branches 
      SET 
        branch_name = COALESCE($1, branch_name),
        branch_code = COALESCE($2, branch_code),
        address = COALESCE($3, address),
        tin = COALESCE($4, tin),
        contact_number = COALESCE($5, contact_number),
        contact_email = COALESCE($6, contact_email),
        is_active = COALESCE($7, is_active),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;
    const values = [
      data.branch_name,
      data.branch_code,
      data.address,
      data.tin,
      data.contact_number,
      data.contact_email,
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
      RETURNING *
    `;
    const result = await query(sql, [isMaintenanceMode, id]);
    return result.rows[0];
  }

  static async softDelete(id) {
    // The "Tombstone Rule": We never delete, we just deactivate
    const sql = `
      UPDATE branches 
      SET is_active = FALSE, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async getStatusById(id) {
    const sql = `SELECT is_active, is_maintenance_mode FROM branches WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findActive() {
    const sql = `SELECT id, branch_name, branch_code FROM branches WHERE is_active = TRUE ORDER BY branch_name ASC`;
    const result = await query(sql);
    return result.rows;
  }
}

module.exports = Branch;
