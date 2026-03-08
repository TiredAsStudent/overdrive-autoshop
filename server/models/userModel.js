const pool = require("../config/db");

const User = {
  findByEmail: async (email) => {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  },

  createTraditionalUser: async (
    email,
    password_hash,
    full_name,
    role,
    branch_id,
  ) => {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, branch_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, full_name, role, branch_id`,
      [email, password_hash, full_name, role || "Customer", branch_id || null],
    );
    return result.rows[0];
  },

  createGoogleUser: async (email, full_name, role, google_id) => {
    const result = await pool.query(
      `INSERT INTO users (email, full_name, role, google_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, full_name, role, branch_id`,
      [email, full_name, role || "Customer", google_id],
    );
    return result.rows[0];
  },

  updateGoogleId: async (email, google_id) => {
    const result = await pool.query(
      "UPDATE users SET google_id = $1 WHERE email = $2 RETURNING id, email, full_name, role, branch_id",
      [google_id, email],
    );
    return result.rows[0];
  },
};

module.exports = User;
