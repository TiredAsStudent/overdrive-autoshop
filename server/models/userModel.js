const pool = require("../config/db");

// Find a user by their email
const getUserByEmail = async (email) => {
  const query = "SELECT * FROM users WHERE email = $1";
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

// Insert a new user (for our initial test accounts)
const createUser = async (email, hashedPassword, role) => {
  const query = `
        INSERT INTO users (email, password, role) 
        VALUES ($1, $2, $3) 
        RETURNING id, email, role, created_at
    `;
  const result = await pool.query(query, [email, hashedPassword, role]);
  return result.rows[0];
};

module.exports = {
  getUserByEmail,
  createUser,
};
