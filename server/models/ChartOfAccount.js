const { query } = require("../config/db");

class ChartOfAccount {
  static async create(data) {
    const sql = `
      INSERT INTO chart_of_accounts (account_code, account_name, account_type, description) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    const values = [
      data.account_code,
      data.account_name,
      data.account_type,
      data.description || null,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async findAll() {
    // Orders by Type first (Assets -> Liabilities), then by Code
    const sql = `
      SELECT * FROM chart_of_accounts 
      ORDER BY 
        CASE account_type
          WHEN 'Asset' THEN 1
          WHEN 'Liability' THEN 2
          WHEN 'Equity' THEN 3
          WHEN 'Revenue' THEN 4
          WHEN 'Expense' THEN 5
        END, 
        account_code ASC
    `;
    const result = await query(sql);
    return result.rows;
  }

  static async findById(id) {
    const sql = `SELECT * FROM chart_of_accounts WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findByCode(accountCode) {
    const sql = `SELECT * FROM chart_of_accounts WHERE account_code = $1`;
    const result = await query(sql, [accountCode]);
    return result.rows[0];
  }

  static async update(id, data) {
    const sql = `
      UPDATE chart_of_accounts 
      SET 
        account_name = COALESCE($1, account_name), 
        description = COALESCE($2, description), 
        status = COALESCE($3, status), 
        updated_at = NOW()
      WHERE id = $4 
      RETURNING *
    `;
    const values = [data.account_name, data.description, data.status, id];
    const result = await query(sql, values);
    return result.rows[0];
  }
}

module.exports = ChartOfAccount;
