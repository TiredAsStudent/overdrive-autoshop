const { query } = require("../../config/db");

class AuthModel {
  static async findUserByEmail(email) {
    const sql = `
      SELECT id, email, password_hash, role, branch_id, google_id, is_active, first_name, last_name 
      FROM users 
      WHERE email = $1
    `;
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  static async linkGoogleId(userId, googleId) {
    const sql = `
      UPDATE users 
      SET google_id = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id
    `;
    await query(sql, [googleId, userId]);
  }

  static async logAudit(userId, branchId, action, ipAddress) {
    const sql = `
      INSERT INTO audit_logs (user_id, branch_id, action, target_resource, target_id, ip_address) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await query(sql, [userId, branchId, action, "users", userId, ipAddress]);
  }
}

module.exports = AuthModel;
