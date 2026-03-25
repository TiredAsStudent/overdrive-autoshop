const bcrypt = require("bcrypt");
const db = require("../../config/db");

const seedDatabase = async () => {
  try {
    console.log("Starting database seeding...");

    //Seed the Three Branches
    console.log("Seeding branches...");
    await db.query(`
      INSERT INTO branches (branch_name, location) 
      VALUES 
        ('Main', 'Biñan, Laguna'), 
        ('Second', 'Batino, Calamba'), 
        ('Third', 'Cabuyao, Laguna')
      ON CONFLICT (branch_name) DO NOTHING;
    `);

    //Get the 'Main' Branch ID to assign to the Admin
    const branchRes = await db.query(
      `SELECT id FROM branches WHERE branch_name = 'Main'`,
    );
    const mainBranchId = branchRes.rows[0].id;

    //Hash the Developer Admin Password
    const plainTextPassword = "OverdriveAdmin123!";
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(plainTextPassword, saltRounds);

    //Insert the Initial Developer Admin
    console.log("Seeding Developer Admin...");
    await db.query(
      `
      INSERT INTO users (branch_id, role, email, password_hash, first_name, last_name)
      VALUES ($1, 'ADMIN', 'admin@overdrive.com', $2, 'System', 'Owner')
      ON CONFLICT (email) DO NOTHING;
    `,
      [mainBranchId, passwordHash],
    );

    console.log("Seeding completed successfully!");
    console.log(`Admin Email: admin@overdrive.com`);
    console.log(`Admin Password: ${plainTextPassword}`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
