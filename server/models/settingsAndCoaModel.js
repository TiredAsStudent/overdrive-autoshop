const db = require("../config/db");

class SettingsAndCoaModel {
  // --- CHART OF ACCOUNTS (COA) METHODS ---
  static async createCoa(accountName, category, description, client = db) {
    const query = `
      INSERT INTO chart_of_accounts (account_name, category, description)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await client.query(query, [
      accountName,
      category,
      description,
    ]);
    return result.rows[0];
  }

  static async updateCoa(
    id,
    accountName,
    category,
    description,
    isActive,
    client = db,
  ) {
    const query = `
      UPDATE chart_of_accounts 
      SET account_name = $1, category = $2, description = $3, is_active = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *;
    `;
    const result = await client.query(query, [
      accountName,
      category,
      description,
      isActive,
      id,
    ]);
    return result.rows[0];
  }

  static async getAllCoa(client = db) {
    const query = `SELECT * FROM chart_of_accounts ORDER BY category, account_name ASC;`;
    const result = await client.query(query);
    return result.rows;
  }

  static async getActiveCoaForDropdown(client = db) {
    const query = `
      SELECT id, account_name, category 
      FROM chart_of_accounts 
      WHERE is_active = TRUE 
      ORDER BY category, account_name ASC;
    `;
    const result = await client.query(query);
    return result.rows;
  }

  // --- GLOBAL SETTINGS METHODS ---
  static async getAllSettings(client = db) {
    const query = `SELECT * FROM global_settings ORDER BY setting_key ASC;`;
    const result = await client.query(query);
    return result.rows;
  }

  static async updateSetting(settingKey, settingValue, adminId, client = db) {
    const query = `
      UPDATE global_settings 
      SET setting_value = $1, updated_by = $2, updated_at = NOW()
      WHERE setting_key = $3
      RETURNING *;
    `;
    const result = await client.query(query, [
      settingValue,
      adminId,
      settingKey,
    ]);
    return result.rows[0];
  }
}

module.exports = SettingsAndCoaModel;
