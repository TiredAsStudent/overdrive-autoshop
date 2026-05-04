require("dotenv").config();
const bcrypt = require("bcrypt");
const { pool, connectDB } = require("../../config/db");

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log("🌱 Seeding initialized...");

    // 1. Insert Default Branch
    const branchRes = await pool.query(`
      INSERT INTO branches (branch_name, branch_code, address, is_active)
      VALUES ('Main Branch', 'MAIN', 'Calamba City', true)
      ON CONFLICT (branch_code) DO NOTHING
      RETURNING id;
    `);
    const branchId = branchRes.rows[0]?.id || 1;

    // 2. Insert System Settings
    await pool.query(`
      INSERT INTO system_settings (id, company_name) 
      VALUES (1, 'Overdrive Auto Shop')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Hash Passwords & Insert Users
    const usersToSeed = [
      {
        email: "admin@overdrive.com",
        pass: "NewAdminBoss@2026!",
        role: "ADMIN",
        branch_id: null,
        fname: "System",
        lname: "Admin",
      },
      {
        email: "manager@overdrive.com",
        pass: "Password123!",
        role: "MANAGER",
        branch_id: null,
        fname: "The",
        lname: "Manager",
      },
      {
        email: "stafftest@overdrive.com",
        pass: "SecurePassword123!",
        role: "STAFF",
        branch_id: branchId,
        fname: "First",
        lname: "Staff",
      },
      {
        email: "stafftest2@overdrive.com",
        pass: "Leocereno_123",
        role: "STAFF",
        branch_id: branchId,
        fname: "Second",
        lname: "Staff",
      },
      {
        email: "stafftest3@overdrive.com",
        pass: "Chriscereno_123",
        role: "STAFF",
        branch_id: branchId,
        fname: "Third",
        lname: "Staff",
      },
    ];

    for (const u of usersToSeed) {
      const hash = await bcrypt.hash(u.pass, 10);
      await pool.query(
        `
        INSERT INTO users (email, password_hash, role, branch_id, first_name, last_name, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (email) DO NOTHING;
      `,
        [u.email, hash, u.role, u.branch_id, u.fname, u.lname],
      );
    }

    console.log(
      "✅ Seeding completed successfully. Your test accounts are ready.",
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
