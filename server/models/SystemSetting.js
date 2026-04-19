const { query } = require("../config/db");

class SystemSetting {
  static async getSettings() {
    const sql = `SELECT * FROM system_settings WHERE id = 1`;
    const result = await query(sql);
    return result.rows[0];
  }

  static async update(data) {
    const sql = `
      UPDATE system_settings 
      SET 
        company_name = COALESCE($1, company_name),
        vat_percentage = COALESCE($2, vat_percentage),
        markup_percentage = COALESCE($3, markup_percentage),
        contact_email = COALESCE($4, contact_email),
        contact_number = COALESCE($5, contact_number),
        logo_url = COALESCE($6, logo_url),
        updated_at = NOW()
      WHERE id = 1
      RETURNING *
    `;
    const values = [
      data.company_name,
      data.vat_percentage,
      data.markup_percentage,
      data.contact_email,
      data.contact_number,
      data.logo_url,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }
}

module.exports = SystemSetting;
