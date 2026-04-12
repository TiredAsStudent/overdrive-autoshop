const { Pool } = require("pg");
require("dotenv").config();

const requiredEnv = ["DB_USER", "DB_HOST", "DB_NAME", "DB_PASSWORD", "DB_PORT"];
const missingEnv = requiredEnv.filter((env) => !process.env[env]);

if (missingEnv.length > 0) {
  console.error(
    `FATAL ERROR: Missing Database Environment Variables: ${missingEnv.join(", ")}`,
  );
  process.exit(1);
}

// Configure the Connection Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
  max: 20, // Handles 20 concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test Connection on Startup
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(
      `Database Connected: [${process.env.DB_NAME}] on port ${process.env.DB_PORT}`,
    );
    client.release();
  } catch (err) {
    console.error("Database Connection Failed:", err.message);
    process.exit(1);
  }
};

// Catch idle client errors globally
pool.on("error", (err) => {
  console.error("Unexpected error on idle client:", err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  connectDB,
};
