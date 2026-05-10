const { query } = require("../config/db");

class Service {
  static async create(data) {
    const sql = `
      INSERT INTO services (service_code, service_name, description, price, estimated_minutes, is_vatable) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
    const values = [
      data.service_code,
      data.service_name,
      data.description || null,
      data.price,
      data.estimated_minutes,
      data.is_vatable,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async findAll() {
    // Orders active services first, then alphabetically by code
    const sql = `SELECT * FROM services ORDER BY is_active DESC, service_code ASC`;
    const result = await query(sql);
    return result.rows;
  }

  static async findById(id) {
    const sql = `SELECT * FROM services WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findByCode(serviceCode) {
    const sql = `SELECT * FROM services WHERE service_code = $1`;
    const result = await query(sql, [serviceCode]);
    return result.rows[0];
  }

  static async update(id, data) {
    const sql = `
      UPDATE services 
      SET 
        service_name = COALESCE($1, service_name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        estimated_minutes = COALESCE($4, estimated_minutes),
        is_vatable = COALESCE($5, is_vatable),
        is_active = COALESCE($6, is_active),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    const values = [
      data.service_name,
      data.description,
      data.price,
      data.estimated_minutes,
      data.is_vatable,
      data.is_active,
      id,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }
}

module.exports = Service;
