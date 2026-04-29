require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
});

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log("🌱 Starting Database Seed Process...");
    await client.query("BEGIN");

    // ---------------------------------------------------------
    // 2. CREATE ALL THREE BRANCHES
    // ---------------------------------------------------------
    const branches = [
      { id: 1, name: "Main Branch", location: "Biñan, Laguna" },
      { id: 2, name: "Second Branch", location: "Batino, Calamba" },
      { id: 3, name: "Third Branch", location: "Cabuyao, Laguna" },
    ];

    for (const b of branches) {
      await client.query(
        `
        INSERT INTO branches (id, branch_name, location) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (id) DO NOTHING;
      `,
        [b.id, b.name, b.location],
      );
      console.log(`✅ Verified Branch: ${b.name}`);
    }

    // ---------------------------------------------------------
    // 3. CREATE THE GLOBAL SUPER ADMIN (branch_id = NULL)
    // ---------------------------------------------------------
    const adminEmail = "admin@overdrive.com";
    const rawPassword = "Admin@123!";
    const userCheck = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [adminEmail],
    );

    if (userCheck.rows.length === 0) {
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      const userQuery = `
        INSERT INTO users (branch_id, role, email, password_hash, first_name, last_name) 
        VALUES (NULL, 'ADMIN', $1, $2, 'System', 'Admin')
        RETURNING id;
      `;
      const userRes = await client.query(userQuery, [adminEmail, passwordHash]);
      console.log(
        `✅ Created Global Super Admin: ${adminEmail} (ID: ${userRes.rows[0].id})`,
      );
    } else {
      console.log(`⚡ Global Super Admin already exists: ${adminEmail}`);
    }

    await client.query("COMMIT");
    console.log("\n🎉 SEEDING COMPLETE! The system is ready.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Seeding Failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
