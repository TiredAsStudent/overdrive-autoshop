const { query, pool } = require("../config/db");

class User {
  // ==========================================
  // LOGIN LOGIC
  // ==========================================
  static async findUserByEmail(email) {
    const sql = `
      SELECT id, email, password_hash, role, branch_id, google_id, is_active, first_name, last_name, token_version 
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

  // ==========================================
  // RESET PASSWORD LOGIC
  // ==========================================
  static async saveResetToken(userId, hashedToken) {
    const sql = `
      UPDATE users 
      SET reset_token = $1, reset_token_expires = NOW() + INTERVAL '15 minutes', updated_at = NOW()
      WHERE id = $2
    `;
    await query(sql, [hashedToken, userId]);
  }

  static async findUserByResetToken(hashedToken) {
    const sql = `
      SELECT id, email, branch_id 
      FROM users 
      WHERE reset_token = $1 AND reset_token_expires > NOW()
    `;
    const result = await query(sql, [hashedToken]);
    return result.rows[0];
  }

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
        SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW(), token_version = token_version + 1
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

  // ==========================================
  // STAFF/MANAGER ACTIVATION
  // ==========================================
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

      const updateSql = `
        UPDATE users 
        SET 
          password_hash = $1, 
          is_active = TRUE, 
          activation_token = NULL, 
          activation_token_expires = NULL, 
          updated_at = NOW(),
          token_version = token_version + 1
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

  // ==========================================
  // CUSTOMER ACTIVATION
  // ==========================================
  static async findCustomerByActivationToken(hashedToken) {
    const sql = `
      SELECT 
        u.id, u.first_name, u.email, u.role, u.activation_token_expires, u.token_version,
        v.make, v.model, v.plate_number
      FROM users u
      LEFT JOIN vehicles v ON v.owner_id = u.id
      WHERE u.activation_token = $1 AND u.role = 'CUSTOMER'
      LIMIT 1
    `;
    const result = await query(sql, [hashedToken]);
    return result.rows[0];
  }

  static async activateCustomerAndLogAudit(userId, newPasswordHash, ipAddress) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updateSql = `
        UPDATE users 
        SET 
          password_hash = $1, 
          is_active = TRUE, 
          activation_token = NULL, 
          activation_token_expires = NULL, 
          updated_at = NOW(),
          token_version = token_version + 1
        WHERE id = $2
      `;
      await client.query(updateSql, [newPasswordHash, userId]);

      const auditSql = `
        INSERT INTO audit_logs (user_id, action, target_resource, target_id, ip_address) 
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(auditSql, [
        userId,
        "CUSTOMER_ACCOUNT_ACTIVATED",
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

  // ==========================================
  // SYSADMIN USER MANAGEMENT LOGIC
  // ==========================================
  static async checkEmailExists(email) {
    const sql = `SELECT id, is_active, password_hash FROM users WHERE email = $1`;
    const result = await query(sql, [email]);
    return result.rows[0];
  }

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

      const userSql = `
        INSERT INTO users (email, role, first_name, last_name, branch_id, activation_token, activation_token_expires, is_active, token_version)
        VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '2 hours', FALSE, 1)
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

  static async getAllUsers() {
    const sql = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.role, u.is_active, 
        u.created_at, b.branch_name, b.id as branch_id,
        CASE 
          WHEN u.password_hash IS NULL AND u.activation_token IS NOT NULL THEN 'PENDING'
          WHEN u.is_active = FALSE THEN 'DEACTIVATED'
          ELSE 'ACTIVE'
        END as account_status
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.role IN ('ADMIN', 'MANAGER', 'STAFF')
      ORDER BY u.created_at DESC;
    `;
    const result = await query(sql);
    return result.rows;
  }

  static async incrementTokenVersion(
    adminId,
    adminBranchId,
    targetUserId,
    ipAddress,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updateSql = `
        UPDATE users 
        SET token_version = token_version + 1, updated_at = NOW()
        WHERE id = $1
        RETURNING id, email;
      `;
      const result = await client.query(updateSql, [targetUserId]);

      const auditSql = `
        INSERT INTO audit_logs (user_id, branch_id, action, target_resource, target_id, ip_address) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(auditSql, [
        adminId,
        adminBranchId,
        "TRIGGERED_SESSION_KILL_SWITCH",
        "users",
        targetUserId,
        ipAddress,
      ]);

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

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
          role = COALESCE($1::user_role, role),
          branch_id = CASE 
                        WHEN COALESCE($1::user_role, role) = 'MANAGER' OR COALESCE($1::user_role, role) = 'ADMIN' THEN NULL 
                        WHEN $2::integer IS NOT NULL THEN $2::integer 
                        ELSE branch_id 
                      END,
          is_active = COALESCE($3::boolean, is_active),
          first_name = COALESCE($4::varchar, first_name),
          last_name = COALESCE($5::varchar, last_name),
          email = COALESCE($6::varchar, email),
          updated_at = NOW()
        WHERE id = $7::integer
        RETURNING id;
      `;
      await client.query(updateSql, [
        updates.role,
        updates.branchId,
        updates.isActive,
        updates.firstName,
        updates.lastName,
        updates.email,
        targetUserId,
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

      const updateSql = `
        UPDATE users 
        SET 
          activation_token = $1, 
          activation_token_expires = NOW() + INTERVAL '2 hours',
          updated_at = NOW()
        WHERE id = $2 AND password_hash IS NULL
        RETURNING id, email, first_name, role;
      `;
      const result = await client.query(updateSql, [
        newHashedToken,
        targetUserId,
      ]);
      const user = result.rows[0];

      if (!user)
        throw new Error("User not found or is already fully activated.");

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

module.exports = User;
