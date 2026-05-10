const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT, 10),
      },
);

const connectDB = async () => {
  try {
    const client = await pool.connect();

    console.log("Database Connected Successfully");

    client.release();
  } catch (err) {
    console.error("Database Connection Failed:", err.message);
    process.exit(1);
  }
};

pool.on("error", (err) => {
  console.error("Unexpected DB Error:", err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  connectDB,
};
