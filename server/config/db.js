const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection immediately on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("Database Connection Error:", err.stack);
  } else {
    console.log("Successfully connected to PostgreSQL (overdrive_db)");
    release();
  }
});

// Catch idle client errors so the server doesn't crash
pool.on("error", (err) => {
  console.error("Unexpected error on idle client:", err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
