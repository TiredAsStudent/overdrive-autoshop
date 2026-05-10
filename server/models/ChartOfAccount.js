const { query } = require("../config/db");

class ChartOfAccount {
  static async create(data) {
    const sql = `
      INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, parent_id) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    const values = [
      data.account_code,
      data.account_name,
      data.account_type,
      data.description || null,
      data.parent_id || null,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async findAll() {
    const sql = `
      SELECT 
        c.*,
        p.account_code AS parent_code,
        p.account_name AS parent_name
      FROM chart_of_accounts c
      LEFT JOIN chart_of_accounts p ON c.parent_id = p.id
      ORDER BY 
        CASE c.account_type
          WHEN 'Asset' THEN 1
          WHEN 'Liability' THEN 2
          WHEN 'Equity' THEN 3
          WHEN 'Revenue' THEN 4
          WHEN 'Expense' THEN 5
        END, 
        c.account_code ASC
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
        parent_id = $4, 
        updated_at = NOW()
      WHERE id = $5 
      RETURNING *
    `;

    const parentId =
      data.parent_id === ""
        ? null
        : data.parent_id !== undefined
          ? data.parent_id
          : undefined;

    const values = [
      data.account_name,
      data.description,
      data.status,
      parentId,
      id,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }
}

module.exports = ChartOfAccount;
