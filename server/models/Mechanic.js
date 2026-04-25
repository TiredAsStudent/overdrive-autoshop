const { query, pool } = require("../config/db");

class MechanicModel {
  static async findMechanicById(id) {
    const sql = `SELECT * FROM mechanics WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async getAllMechanics(branchId) {
    let sql = `
      SELECT m.id, m.first_name, m.last_name, m.specialization, m.certification_level, 
             m.contact_number, m.status, m.branch_id, b.branch_name 
      FROM mechanics m
      LEFT JOIN branches b ON m.branch_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (branchId) {
      params.push(branchId);
      sql += ` AND m.branch_id = $1`;
    }

    sql += ` 
      ORDER BY 
        CASE 
          WHEN m.status = 'ACTIVE' THEN 1 
          WHEN m.status = 'ON_LEAVE' THEN 2 
          ELSE 3 
        END ASC, 
        m.last_name ASC
    `;
    const result = await query(sql, params);
    return result.rows;
  }

  static async createMechanic(data) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertSql = `
        INSERT INTO mechanics (branch_id, first_name, last_name, specialization, certification_level, contact_number, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const mechanicResult = await client.query(insertSql, [
        data.branch_id,
        data.first_name,
        data.last_name,
        data.specialization,
        data.certification_level || "Junior",
        data.contact_number,
        data.status || "ACTIVE",
      ]);

      await client.query("COMMIT");
      return mechanicResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateMechanic(id, updates) {
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
        UPDATE mechanics 
        SET ${fields.join(", ")} 
        WHERE id = $1 
        RETURNING *
      `;
      const result = await client.query(updateSql, params);

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = MechanicModel;
