const { query } = require("../config/db");

class SystemSetting {
  static async getSettings() {
    const sql = `SELECT * FROM system_settings WHERE id = 1`;
    const result = await query(sql);

    if (result.rows.length === 0) {
      const initSql = `
        INSERT INTO system_settings (id, company_name, vat_percentage, markup_percentage) 
        VALUES (1, 'Overdrive Auto Shop', 12.00, 20.00) 
        RETURNING *;
      `;
      const initResult = await query(initSql);
      return initResult.rows[0];
    }

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
      data.company_name !== undefined ? data.company_name : null,
      data.vat_percentage !== undefined ? data.vat_percentage : null,
      data.markup_percentage !== undefined ? data.markup_percentage : null,
      data.contact_email !== undefined ? data.contact_email : null,
      data.contact_number !== undefined ? data.contact_number : null,
      data.logo_url !== undefined ? data.logo_url : null,
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }
}

module.exports = SystemSetting;
