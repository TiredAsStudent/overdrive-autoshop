const db = require("../config/db");

class UserModel {
  static async findByEmail(email, client = db) {
    const query = `SELECT * FROM users WHERE email = $1 AND is_active = TRUE`;
    const result = await client.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id, client = db) {
    const query = `SELECT id, role, branch_id, is_active FROM users WHERE id = $1`;
    const result = await client.query(query, [id]);
    return result.rows[0];
  }

  // Universal create method for Staff/Admins
  static async createStaff(
    branchId,
    role,
    email,
    passwordHash,
    firstName,
    lastName,
    client = db,
  ) {
    const query = `
      INSERT INTO users (branch_id, role, email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, role, branch_id;
    `;
    const result = await client.query(query, [
      branchId,
      role,
      email,
      passwordHash,
      firstName,
      lastName,
    ]);
    return result.rows[0];
  }

  // Universal create method for Customers
  static async createCustomer(
    branchId,
    email,
    passwordHash,
    firstName,
    lastName,
    client = db,
  ) {
    const query = `
      INSERT INTO users (branch_id, role, email, password_hash, first_name, last_name)
      VALUES ($1, 'CUSTOMER', $2, $3, $4, $5)
      RETURNING id, email, role, branch_id;
    `;
    const result = await client.query(query, [
      branchId,
      email,
      passwordHash,
      firstName,
      lastName,
    ]);
    return result.rows[0];
  }

  static async linkGoogleId(id, googleId, client = db) {
    const query = `UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2`;
    await client.query(query, [googleId, id]);
  }
}

module.exports = UserModel;
