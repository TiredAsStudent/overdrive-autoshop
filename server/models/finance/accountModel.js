const { query, pool } = require("../../config/db");

class AccountModel {
  static async findCategoryByName(name) {
    const sql = `SELECT id, name FROM account_categories WHERE LOWER(name) = LOWER($1)`;
    const result = await query(sql, [name]);
    return result.rows[0];
  }

  static async findCategoryById(id) {
    const sql = `SELECT id, name, type, is_active FROM account_categories WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async getAllCategories(typeFilter) {
    let sql = `SELECT id, name, type, description, is_active, created_at FROM account_categories`;
    const params = [];

    if (typeFilter) {
      params.push(typeFilter);
      sql += ` WHERE type = $1`;
    }

    sql += ` ORDER BY type ASC, name ASC`;
    const result = await query(sql, params);
    return result.rows;
  }

  static async createCategoryAndLogAudit(data, userId, ipAddress) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert Category
      const insertSql = `
        INSERT INTO account_categories (name, type, description)
        VALUES ($1, $2, $3)
        RETURNING id, name, type, is_active
      `;
      const categoryResult = await client.query(insertSql, [
        data.name,
        data.type,
        data.description,
      ]);
      const newCategory = categoryResult.rows[0];

      // 2. Log Audit (Global Action, so branch_id is NULL)
      const auditSql = `
        INSERT INTO audit_logs (user_id, action, target_resource, target_id, ip_address) 
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(auditSql, [
        userId,
        "FINANCE_CATEGORY_CREATED",
        "account_categories",
        newCategory.id,
        ipAddress,
      ]);

      await client.query("COMMIT");
      return newCategory;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateCategoryAndLogAudit(id, updates, userId, ipAddress) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

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
        UPDATE account_categories 
        SET ${fields.join(", ")} 
        WHERE id = $1 
        RETURNING *
      `;
      const result = await client.query(updateSql, params);
      const updatedCategory = result.rows[0];

      const auditSql = `
        INSERT INTO audit_logs (user_id, action, target_resource, target_id, ip_address) 
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(auditSql, [
        userId,
        "FINANCE_CATEGORY_UPDATED",
        "account_categories",
        id,
        ipAddress,
      ]);

      await client.query("COMMIT");
      return updatedCategory;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async getRealTimeBalances(branchId) {
    const sql = `
      SELECT 
        ac.id AS category_id,
        ac.name AS category_name,
        ac.type,
        COALESCE(
          SUM(
            CASE 
              WHEN fl.transaction_type = 'CREDIT' THEN fl.amount 
              ELSE -fl.amount 
            END
          ), 0
        ) as current_balance
      FROM account_categories ac
      LEFT JOIN financial_ledger fl 
        ON ac.id = fl.account_category_id 
        ${branchId ? `AND fl.branch_id = $1` : ``}
      WHERE ac.is_active = TRUE
      GROUP BY ac.id, ac.name, ac.type
      ORDER BY ac.type ASC, ac.name ASC
    `;
    const params = branchId ? [branchId] : [];
    const result = await query(sql, params);
    return result.rows;
  }
}

module.exports = AccountModel;
