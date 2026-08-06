const { query } = require("../config/db");

class Service {
  static async create(data) {
    const sql = `
      INSERT INTO services (service_code, service_name, category, description, price, estimated_minutes, commonly_used_parts, is_vatable, income_account_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `;
    const values = [
      data.service_code,
      data.service_name,
      data.category,
      data.description,
      data.price,
      data.estimated_minutes,
      data.commonly_used_parts,
      data.is_vatable,
      data.income_account_id,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async findByCategoryAndName(category, serviceName, excludeId = null) {
    let sql = `SELECT id FROM services WHERE category = $1 AND service_name ILIKE $2`;
    const params = [category, serviceName];

    if (excludeId) {
      sql += ` AND id != $3`;
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async getLatestCodeByPrefix(prefix) {
    const sql = `SELECT service_code FROM services WHERE service_code LIKE $1 ORDER BY id DESC LIMIT 1`;
    const result = await query(sql, [`${prefix}%`]);
    return result.rows[0];
  }

  static async countFiltered(search, category, status) {
    let sql = `SELECT COUNT(*) FROM services`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(service_name ILIKE $${paramIdx} OR service_code ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (category && category !== "all") {
      conditions.push(`category = $${paramIdx}`);
      values.push(category);
      paramIdx++;
    }
    if (status === "active") conditions.push(`is_active = TRUE`);
    else if (status === "archived") conditions.push(`is_active = FALSE`);

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");

    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedFiltered(limit, offset, search, category, status) {
    let sql = `
      SELECT services.*,
        chart_of_accounts.account_code as income_account_code,
        chart_of_accounts.account_name as income_account_name,
        (SELECT COUNT(DISTINCT invoice_id) FROM invoice_items WHERE service_id = services.id) AS usage_count,
        (SELECT MAX(i.created_at) FROM invoices i JOIN invoice_items ii ON i.id = ii.invoice_id WHERE ii.service_id = services.id) AS last_used_date
      FROM services
      LEFT JOIN chart_of_accounts ON services.income_account_id = chart_of_accounts.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(services.service_name ILIKE $${paramIdx} OR services.service_code ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (category && category !== "all") {
      conditions.push(`services.category = $${paramIdx}`);
      values.push(category);
      paramIdx++;
    }
    if (status === "active") conditions.push(`services.is_active = TRUE`);
    else if (status === "archived")
      conditions.push(`services.is_active = FALSE`);

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");

    sql += ` ORDER BY services.is_active DESC, services.category ASC, services.service_name ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  static async findById(id) {
    const sql = `
      SELECT *,
        (SELECT COUNT(DISTINCT invoice_id) FROM invoice_items WHERE service_id = services.id) AS usage_count,
        (SELECT MAX(i.created_at) FROM invoices i JOIN invoice_items ii ON i.id = ii.invoice_id WHERE ii.service_id = services.id) AS last_used_date
      FROM services WHERE id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const sql = `
      UPDATE services 
      SET 
        service_name = COALESCE($1, service_name),
        category = COALESCE($2, category),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        estimated_minutes = COALESCE($5, estimated_minutes),
        commonly_used_parts = COALESCE($6, commonly_used_parts),
        is_vatable = COALESCE($7, is_vatable),
        income_account_id = COALESCE($8, income_account_id),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;
    const values = [
      data.service_name,
      data.category,
      data.description,
      data.price,
      data.estimated_minutes,
      data.commonly_used_parts,
      data.is_vatable,
      data.income_account_id,
      id,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async toggleStatus(id, isActive) {
    const sql = `UPDATE services SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const result = await query(sql, [isActive, id]);
    return result.rows[0];
  }
}

module.exports = Service;
