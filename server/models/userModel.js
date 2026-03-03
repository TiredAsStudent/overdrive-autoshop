const pool = require("../config/db");

// Find a user by their email
const getUserByEmail = async (email) => {
  const query = "SELECT * FROM users WHERE email = $1";
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

const createUser = async (email, hashedPassword, role, branch_id) => {
  const query = `
    INSERT INTO users (email, password, role, branch_id) 
    VALUES ($1, $2, $3, $4) 
    RETURNING id, email, role, branch_id, created_at
  `;
  const result = await pool.query(query, [
    email,
    hashedPassword,
    role,
    branch_id,
  ]);
  return result.rows[0];
};

const getUserById = async (id) => {
  const query =
    "SELECT id, email, role, branch_id, created_at FROM users WHERE id = $1";
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  getUserByEmail,
  createUser,
  getUserById,
};
