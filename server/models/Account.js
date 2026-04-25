const { query, pool } = require("../config/db");

class AccountModel {
  static async checkCodeExists(code) {
    const sql = `SELECT id FROM chart_of_accounts WHERE account_code = $1`;
    const result = await query(sql, [code]);
    return result.rows[0];
  }

  static async findAccountById(id) {
    const sql = `SELECT * FROM chart_of_accounts WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async getCategoryById(id) {
    const sql = `SELECT category_name, code_range_start, code_range_end FROM account_categories WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async getAllCategories() {
    const sql = `SELECT * FROM account_categories ORDER BY id ASC`;
    const result = await query(sql);
    return result.rows;
  }

  static async createAccount(data) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertSql = `
        INSERT INTO chart_of_accounts (category_id, account_code, account_name, staff_label, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const accResult = await client.query(insertSql, [
        data.category_id,
        data.account_code,
        data.account_name,
        data.staff_label,
        data.description,
      ]);
      const newAccount = accResult.rows[0];

      // Initialize 0.00 balances for ALL active branches automatically
      const branchSql = `SELECT id FROM branches WHERE is_active = TRUE`;
      const branches = await client.query(branchSql);

      for (let branch of branches.rows) {
        await client.query(
          `INSERT INTO account_balances (account_id, branch_id, balance) VALUES ($1, $2, 0.00)`,
          [newAccount.id, branch.id],
        );
      }

      await client.query("COMMIT");
      return newAccount;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateAccount(id, updates) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const checkSql = `SELECT is_system_locked FROM chart_of_accounts WHERE id = $1`;
      const checkResult = await client.query(checkSql, [id]);

      if (!checkResult.rows[0]) throw new Error("Account not found.");
      if (checkResult.rows[0].is_system_locked && updates.is_active === false) {
        throw new Error("System accounts cannot be deactivated.");
      }

      const fields = [];
      const params = [id];
      let paramIndex = 2;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          fields.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
      fields.push(`updated_at = NOW()`);

      const updateSql = `
        UPDATE chart_of_accounts 
        SET ${fields.join(", ")} 
        WHERE id = $1 
        RETURNING *
      `;
      const result = await client.query(updateSql, params);
      const updatedAccount = result.rows[0];

      await client.query("COMMIT");
      return updatedAccount;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async getRealTimeBalances() {
    const sql = `
      SELECT 
        coa.id as account_id,
        coa.account_code,
        coa.account_name,
        coa.staff_label,
        coa.is_active, 
        ac.category_name,
        b.id as branch_id,
        b.branch_name,
        COALESCE(ab.balance, 0.00) as balance
      FROM chart_of_accounts coa
      JOIN account_categories ac ON coa.category_id = ac.id
      CROSS JOIN branches b
      LEFT JOIN account_balances ab ON ab.account_id = coa.id AND ab.branch_id = b.id
      WHERE b.is_active = TRUE
      ORDER BY coa.account_code ASC, b.id ASC
    `;
    const result = await query(sql);
    return result.rows;
  }
}

module.exports = AccountModel;
