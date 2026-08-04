const { query } = require("../config/db");

class ChartOfAccounts {
  static async checkDuplicate(accountCode, accountName, excludeId = null) {
    let sql = `SELECT id, account_code, account_name FROM chart_of_accounts WHERE (account_code = $1 OR account_name ILIKE $2)`;
    const params = [accountCode, accountName];

    if (excludeId) {
      sql += ` AND id != $3`;
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async create(data) {
    const sql = `
      INSERT INTO chart_of_accounts (
        account_code, account_name, account_type, parent_id, description, is_vat_applicable
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      data.account_code,
      data.account_name,
      data.account_type,
      data.parent_id || null,
      data.description || null,
      data.is_vat_applicable,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async update(id, data) {
    const setClauses = [];
    const values = [];
    let paramIdx = 1;

    const fields = [
      "account_name",
      "parent_id",
      "description",
      "is_vat_applicable",
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = $${paramIdx}`);
        values.push(data[field]);
        paramIdx++;
      }
    }

    if (setClauses.length === 0) {
      return (
        await query(`SELECT * FROM chart_of_accounts WHERE id = $1`, [id])
      ).rows[0];
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE chart_of_accounts SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async toggleStatus(id, isActive) {
    const sql = `UPDATE chart_of_accounts SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const result = await query(sql, [isActive, id]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT c.*, p.account_name as parent_account_name 
      FROM chart_of_accounts c
      LEFT JOIN chart_of_accounts p ON c.parent_id = p.id
      WHERE c.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async countFiltered(search, type, status) {
    let sql = `SELECT COUNT(*) FROM chart_of_accounts`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(account_code ILIKE $${paramIdx} OR account_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (type && type !== "all") {
      conditions.push(`account_type = $${paramIdx}`);
      values.push(type.toUpperCase());
      paramIdx++;
    }
    if (status === "active") conditions.push(`is_active = TRUE`);
    else if (status === "inactive") conditions.push(`is_active = FALSE`);

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedFiltered(limit, offset, search, type, status) {
    let sql = `
      SELECT c.*, p.account_name as parent_account_name 
      FROM chart_of_accounts c
      LEFT JOIN chart_of_accounts p ON c.parent_id = p.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(c.account_code ILIKE $${paramIdx} OR c.account_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (type && type !== "all") {
      conditions.push(`c.account_type = $${paramIdx}`);
      values.push(type.toUpperCase());
      paramIdx++;
    }
    if (status === "active") conditions.push(`c.is_active = TRUE`);
    else if (status === "inactive") conditions.push(`c.is_active = FALSE`);

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY c.account_code ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  static async countAccountUsage(accountId) {
    try {
      const sql = `
        SELECT SUM(cnt) as total FROM (
          SELECT COUNT(*) as cnt FROM expenses WHERE account_id = $1
          UNION ALL
          SELECT COUNT(*) as cnt FROM supplier_bills WHERE account_id = $1
        ) t
      `;
      const result = await query(sql, [accountId]);
      return parseInt(result.rows[0].total || 0, 10);
    } catch (error) {
      return 0;
    }
  }

  static async getAccountUsage(accountId, limit, offset) {
    try {
      const sql = `
        SELECT 
          'EXPENSE' as transaction_type,
          expense_number as reference,
          expense_date as transaction_date,
          total_amount as amount,
          status
        FROM expenses WHERE account_id = $1
        UNION ALL
        SELECT 
          'BILL' as transaction_type,
          bill_number as reference,
          bill_date as transaction_date,
          grand_total as amount,
          status
        FROM supplier_bills WHERE account_id = $1
        ORDER BY transaction_date DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await query(sql, [accountId, limit, offset]);
      return result.rows;
    } catch (error) {
      return [];
    }
  }
}

module.exports = ChartOfAccounts;
