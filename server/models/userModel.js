const db = require("../config/db");

class UserModel {
  static async findByEmail(email) {
    const query = `SELECT * FROM users WHERE email = $1 AND is_active = TRUE`;
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `SELECT id, role, branch_id, is_active FROM users WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async createStaff(
    branchId,
    role,
    email,
    passwordHash,
    firstName,
    lastName,
  ) {
    const query = `
      INSERT INTO users (branch_id, role, email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, role, branch_id;
    `;
    const result = await db.query(query, [
      branchId,
      role,
      email,
      passwordHash,
      firstName,
      lastName,
    ]);
    return result.rows[0];
  }

  static async linkGoogleId(id, googleId) {
    const query = `UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2`;
    await db.query(query, [googleId, id]);
  }
}

module.exports = UserModel;
