const { query } = require("../config/db");

class Mechanic {
  static async getLastEmployeeId() {
    const sql = `SELECT employee_id FROM mechanics ORDER BY id DESC LIMIT 1`;
    const result = await query(sql);
    return result.rows[0]?.employee_id || null;
  }

  static async create(data) {
    const sql = `
      INSERT INTO mechanics (employee_id, first_name, last_name, phone_number, branch_id, skills) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
    // Pass the array directly; node-postgres handles the conversion to TEXT[]
    const values = [
      data.employee_id,
      data.first_name,
      data.last_name,
      data.phone_number || null,
      data.branch_id,
      data.skills,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async findAll() {
    const sql = `
      SELECT 
        m.*, 
        b.branch_name, 
        b.branch_code 
      FROM mechanics m
      LEFT JOIN branches b ON m.branch_id = b.id
      ORDER BY 
        CASE m.status
          WHEN 'Active' THEN 1
          WHEN 'On Leave' THEN 2
          WHEN 'Inactive' THEN 3
        END,
        m.last_name ASC
    `;
    const result = await query(sql);
    return result.rows;
  }

  static async findById(id) {
    const sql = `SELECT * FROM mechanics WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findByEmployeeId(employeeId) {
    const sql = `SELECT * FROM mechanics WHERE employee_id = $1`;
    const result = await query(sql, [employeeId]);
    return result.rows[0];
  }

  static async update(id, data) {
    const sql = `
      UPDATE mechanics 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone_number = COALESCE($3, phone_number),
        branch_id = COALESCE($4, branch_id),
        skills = COALESCE($5, skills),
        status = COALESCE($6, status),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    const values = [
      data.first_name,
      data.last_name,
      data.phone_number,
      data.branch_id,
      data.skills,
      data.status,
      id,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }
}

module.exports = Mechanic;
