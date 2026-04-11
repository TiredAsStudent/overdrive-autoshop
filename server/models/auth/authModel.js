const { query, pool } = require("../../config/db");

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

  // Save the hashed token and set expiry to 15 minutes from now
  static async saveResetToken(userId, hashedToken) {
    const sql = `
      UPDATE users 
      SET reset_token = $1, reset_token_expires = NOW() + INTERVAL '15 minutes', updated_at = NOW()
      WHERE id = $2
    `;
    await query(sql, [hashedToken, userId]);
  }

  // Find user by valid token (checks if it exists AND is not expired)
  static async findUserByResetToken(hashedToken) {
    const sql = `
      SELECT id, email, branch_id 
      FROM users 
      WHERE reset_token = $1 AND reset_token_expires > NOW()
    `;
    const result = await query(sql, [hashedToken]);
    return result.rows[0];
  }

  // Update the password and instantly BURN the token AND log it
  static async updatePasswordAndLogAudit(
    userId,
    newPasswordHash,
    branchId,
    ipAddress,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updateSql = `
        UPDATE users 
        SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
        WHERE id = $2
      `;
      await client.query(updateSql, [newPasswordHash, userId]);

      const auditSql = `
        INSERT INTO audit_logs (user_id, branch_id, action, target_resource, target_id, ip_address) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(auditSql, [
        userId,
        branchId,
        "PASSWORD_RESET_SUCCESS",
        "users",
        userId,
        ipAddress,
      ]);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // --- ACTIVATION LOGIC ---

  // Find user by activation token
  static async findUserByActivationToken(hashedToken) {
    const sql = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.branch_id, 
        u.activation_token_expires, b.branch_name 
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.activation_token = $1 AND u.activation_token_expires > NOW()
    `;
    const result = await query(sql, [hashedToken]);
    return result.rows[0];
  }

  static async activateUserAndLogAudit(
    userId,
    newPasswordHash,
    branchId,
    ipAddress,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update Password and Activate User
      const updateSql = `
        UPDATE users 
        SET 
          password_hash = $1, 
          is_active = TRUE, 
          activation_token = NULL, 
          activation_token_expires = NULL, 
          updated_at = NOW()
        WHERE id = $2
      `;
      await client.query(updateSql, [newPasswordHash, userId]);

      const auditSql = `
        INSERT INTO audit_logs (user_id, branch_id, action, target_resource, target_id, ip_address) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(auditSql, [
        userId,
        branchId,
        "ACCOUNT_ACTIVATED_POLICY_SIGNED",
        "users",
        userId,
        ipAddress,
      ]);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = AuthModel;
