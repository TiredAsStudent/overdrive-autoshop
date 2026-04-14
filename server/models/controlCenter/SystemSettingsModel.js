const { query } = require("../../config/db");

class SystemSettingsModel {
  // --- FINANCIAL SETTINGS ---

  static async getFinancialSettings() {
    const sql = `
      SELECT markup_percentage, vat_percentage, updated_at 
      FROM system_settings 
      WHERE id = 1
    `;
    const result = await query(sql);
    return result.rows[0];
  }

  static async updateFinancialSettings(markup, vat) {
    const sql = `
      UPDATE system_settings 
      SET 
        markup_percentage = $1, 
        vat_percentage = $2, 
        updated_at = NOW() 
      WHERE id = 1 
      RETURNING markup_percentage, vat_percentage, updated_at
    `;
    const result = await query(sql, [markup, vat]);
    return result.rows[0];
  }

  // --- BRANCH INFORMATION ---

  static async getAllBranches() {
    const sql = `
      SELECT id, branch_name, address, contact_number, created_at, updated_at
      FROM branches
      ORDER BY id ASC
    `;
    const result = await query(sql);
    return result.rows;
  }

  static async updateBranchDetails(branchId, address, contactNumber) {
    const sql = `
      UPDATE branches 
      SET 
        address = COALESCE($1, address),
        contact_number = COALESCE($2, contact_number),
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, branch_name, address, contact_number
    `;
    const result = await query(sql, [address, contactNumber, branchId]);
    return result.rows[0];
  }

  // --- AUDIT LOGGING ---
  static async logAudit(
    userId,
    branchId,
    action,
    targetResource,
    targetId,
    ipAddress,
  ) {
    const sql = `
      INSERT INTO audit_logs (user_id, branch_id, action, target_resource, target_id, ip_address) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await query(sql, [
      userId,
      branchId,
      action,
      targetResource,
      targetId,
      ipAddress,
    ]);
  }
}

module.exports = SystemSettingsModel;
