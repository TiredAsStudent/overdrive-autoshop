const db = require("../../config/db");

async function seedFinanceRules() {
  console.log("Starting Finance Rules Seeder...");
  try {
    // ON CONFLICT DO NOTHING ensures don't duplicate data if run twice
    const query = `
      INSERT INTO global_settings (setting_key, setting_value, description) VALUES
      ('DEFAULT_MARKUP_PERCENTAGE', 25.00, 'Default markup applied to inventory parts from OCR'),
      ('VAT_PERCENTAGE', 12.00, 'Standard Value Added Tax percentage')
      ON CONFLICT (setting_key) DO NOTHING;
    `;
    await db.query(query);
    console.log("Finance Rules (12% VAT, +25% Markup) seeded successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    process.exit(0);
  }
}

seedFinanceRules();
