const { query, pool } = require("../config/db");

class User {
  static async findUserByEmail(email) {
    const sql = `SELECT id, email, password_hash, role, branch_id, google_id, is_active, first_name, last_name, token_version FROM users WHERE email = $1`;
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  static async linkGoogleId(userId, googleId) {
    const sql = `UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2 RETURNING id`;
    await query(sql, [googleId, userId]);
  }

  static async saveResetToken(userId, hashedToken) {
    const sql = `UPDATE users SET reset_token = $1, reset_token_expires = NOW() + INTERVAL '15 minutes', updated_at = NOW() WHERE id = $2`;
    await query(sql, [hashedToken, userId]);
  }

  static async findUserByResetToken(hashedToken) {
    const sql = `SELECT id, email, branch_id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()`;
    const result = await query(sql, [hashedToken]);
    return result.rows[0];
  }

  static async updatePassword(userId, newPasswordHash) {
    const updateSql = `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW(), token_version = token_version + 1 WHERE id = $2`;
    await query(updateSql, [newPasswordHash, userId]);
  }

  static async findUserByActivationToken(hashedToken) {
    const sql = `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.branch_id, u.activation_token_expires, b.branch_name FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE u.activation_token = $1 AND u.activation_token_expires > NOW()`;
    const result = await query(sql, [hashedToken]);
    return result.rows[0];
  }

  static async activateUser(userId, newPasswordHash) {
    const updateSql = `UPDATE users SET password_hash = $1, is_active = TRUE, activation_token = NULL, activation_token_expires = NULL, updated_at = NOW(), token_version = token_version + 1 WHERE id = $2`;
    await query(updateSql, [newPasswordHash, userId]);
  }

  static async findCustomerByActivationToken(hashedToken) {
    const sql = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.activation_token_expires, u.token_version, 
             v.make, v.model, v.plate_number 
      FROM users u 
      LEFT JOIN vehicles v ON v.owner_id = u.id 
      WHERE u.activation_token = $1 AND u.role = 'CUSTOMER' LIMIT 1
    `;
    const result = await query(sql, [hashedToken]);
    return result.rows[0];
  }
  static async activateCustomerWithProfile(
    userId,
    newPasswordHash,
    profileData,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Activate Account & Update Customer Name
      const updateSql = `
        UPDATE users 
        SET 
          password_hash = $1, 
          is_active = TRUE, 
          activation_token = NULL, 
          activation_token_expires = NULL, 
          first_name = $2,
          last_name = $3,
          updated_at = NOW(), 
          token_version = token_version + 1 
        WHERE id = $4
      `;
      await client.query(updateSql, [
        newPasswordHash,
        profileData.first_name,
        profileData.last_name,
        userId,
      ]);

      // Update Vehicle Specifics
      const vehicleSql = `
        UPDATE vehicles 
        SET 
          make = $1, 
          model = $2, 
          year = $3, 
          updated_at = NOW()
        WHERE owner_id = $4
      `;
      await client.query(vehicleSql, [
        profileData.make,
        profileData.model,
        profileData.year,
        userId,
      ]);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async checkEmailExists(email) {
    const sql = `SELECT id, is_active, password_hash FROM users WHERE email = $1`;
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  static async createUser(userData, hashedToken) {
    const userSql = `INSERT INTO users (email, role, first_name, last_name, branch_id, activation_token, activation_token_expires, is_active, token_version) VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '2 hours', FALSE, 1) RETURNING id, email, role;`;
    const userResult = await query(userSql, [
      userData.email,
      userData.role,
      userData.firstName,
      userData.lastName,
      userData.branchId || null,
      hashedToken,
    ]);
    return userResult.rows[0];
  }

  static async getAllUsers() {
    const sql = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.is_active, u.created_at, b.branch_name, b.id as branch_id,
        CASE WHEN u.password_hash IS NULL AND u.activation_token IS NOT NULL THEN 'PENDING'
             WHEN u.is_active = FALSE THEN 'DEACTIVATED'
             ELSE 'ACTIVE' END as account_status
      FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE u.role IN ('ADMIN', 'MANAGER', 'STAFF') ORDER BY u.created_at DESC;
    `;
    const result = await query(sql);
    return result.rows;
  }

  static async incrementTokenVersion(targetUserId) {
    const updateSql = `UPDATE users SET token_version = token_version + 1, updated_at = NOW() WHERE id = $1 RETURNING id, email;`;
    const result = await query(updateSql, [targetUserId]);
    return result.rows[0];
  }

  static async updateUser(targetUserId, updates) {
    const updateSql = `
      UPDATE users SET 
        role = COALESCE($1::user_role, role),
        branch_id = CASE WHEN COALESCE($1::user_role, role) = 'MANAGER' OR COALESCE($1::user_role, role) = 'ADMIN' THEN NULL 
                         WHEN $2::integer IS NOT NULL THEN $2::integer ELSE branch_id END,
        is_active = COALESCE($3::boolean, is_active),
        first_name = COALESCE($4::varchar, first_name),
        last_name = COALESCE($5::varchar, last_name),
        email = COALESCE($6::varchar, email),
        updated_at = NOW()
      WHERE id = $7::integer RETURNING id;
    `;
    await query(updateSql, [
      updates.role,
      updates.branch_id,
      updates.is_active,
      updates.first_name,
      updates.last_name,
      updates.email,
      targetUserId,
    ]);
  }

  static async regenerateActivationToken(targetUserId, newHashedToken) {
    const updateSql = `UPDATE users SET activation_token = $1, activation_token_expires = NOW() + INTERVAL '2 hours', updated_at = NOW() WHERE id = $2 AND password_hash IS NULL RETURNING id, email, first_name, role;`;
    const result = await query(updateSql, [newHashedToken, targetUserId]);
    if (!result.rows[0])
      throw new Error("User not found or is already fully activated.");
    return result.rows[0];
  }
}

module.exports = User;
