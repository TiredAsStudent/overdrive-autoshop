const { query, pool } = require("../../config/db");

class UserManagementModel {
  // Check if email already exists
  static async checkEmailExists(email) {
    const sql = `SELECT id, is_active, password_hash FROM users WHERE email = $1`;
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  // Create the User & Generate the Invite (Atomic)
  static async createUserAndLogAudit(
    adminId,
    adminBranchId,
    userData,
    hashedToken,
    ipAddress,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert the new pending user
      const userSql = `
        INSERT INTO users (email, role, first_name, last_name, branch_id, activation_token, activation_token_expires, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '2 hours', FALSE)
        RETURNING id, email, role;
      `;
      const userResult = await client.query(userSql, [
        userData.email,
        userData.role,
        userData.firstName,
        userData.lastName,
        userData.branchId || null,
        hashedToken,
      ]);
      const newUser = userResult.rows[0];

      // Record the action in the Immutable Audit Log
      const auditSql = `
        INSERT INTO audit_logs (user_id, branch_id, action, target_resource, target_id, ip_address) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(auditSql, [
        adminId,
        adminBranchId,
        `INVITED_NEW_${userData.role}`,
        "users",
        newUser.id,
        ipAddress,
      ]);

      await client.query("COMMIT");
      return newUser;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Fetch the "Live Roster" for the Admin Status Tracker
  static async getAllUsers() {
    const sql = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.role, u.is_active, 
        u.created_at, b.branch_name,
        CASE 
          WHEN u.password_hash IS NULL AND u.activation_token IS NOT NULL THEN 'PENDING'
          WHEN u.is_active = FALSE THEN 'DEACTIVATED'
          ELSE 'ACTIVE'
        END as account_status
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.role IN ('ADMIN', 'STAFF')
      ORDER BY u.created_at DESC;
    `;
    const result = await query(sql);
    return result.rows;
  }

  // Update Branch or Status (Atomic)
  static async updateUserAndLogAudit(
    adminId,
    adminBranchId,
    targetUserId,
    updates,
    ipAddress,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updateSql = `
        UPDATE users 
        SET 
          role = COALESCE($4::user_role, role),
          branch_id = CASE 
                        WHEN COALESCE($4::user_role, role) = 'ADMIN' THEN NULL 
                        WHEN $1::integer IS NOT NULL THEN $1::integer 
                        ELSE branch_id 
                      END,
          is_active = COALESCE($2::boolean, is_active),
          first_name = COALESCE($5::varchar, first_name),
          last_name = COALESCE($6::varchar, last_name),
          email = COALESCE($7::varchar, email),
          updated_at = NOW()
        WHERE id = $3::integer
        RETURNING id, email, is_active, branch_id, role;
      `;
      await client.query(updateSql, [
        updates.branchId,
        updates.isActive,
        targetUserId,
        updates.role,
        updates.firstName,
        updates.lastName,
        updates.email,
      ]);

      const auditSql = `
        INSERT INTO audit_logs (user_id, branch_id, action, target_resource, target_id, ip_address) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(auditSql, [
        adminId,
        adminBranchId,
        "UPDATED_USER_PROFILE",
        "users",
        targetUserId,
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

  static async regenerateActivationToken(
    adminId,
    adminBranchId,
    targetUserId,
    newHashedToken,
    ipAddress,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update the user with a fresh 2-hour token
      const updateSql = `
        UPDATE users 
        SET 
          activation_token = $1, 
          activation_token_expires = NOW() + INTERVAL '2 hours',
          updated_at = NOW()
        WHERE id = $2 AND is_active = FALSE
        RETURNING id, email, first_name, role;
      `;
      const result = await client.query(updateSql, [
        newHashedToken,
        targetUserId,
      ]);
      const user = result.rows[0];

      if (!user) throw new Error("User not found or is already active.");

      // Log the action
      const auditSql = `
        INSERT INTO audit_logs (user_id, branch_id, action, target_resource, target_id, ip_address) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(auditSql, [
        adminId,
        adminBranchId,
        "RESENT_INVITATION",
        "users",
        targetUserId,
        ipAddress,
      ]);

      await client.query("COMMIT");
      return user;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = UserManagementModel;
