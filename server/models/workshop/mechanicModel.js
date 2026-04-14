const { query, pool } = require("../../config/db");

class MechanicModel {
  static async findMechanicById(id) {
    const sql = `SELECT * FROM mechanics WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async getAllMechanics(branchId) {
    // If branchId is null, it means the Admin is viewing "All Branches"
    let sql = `
      SELECT m.id, m.first_name, m.last_name, m.specialization, m.contact_number, m.is_active, m.branch_id, b.branch_name 
      FROM mechanics m
      LEFT JOIN branches b ON m.branch_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (branchId) {
      params.push(branchId);
      sql += ` AND m.branch_id = $1`;
    }

    sql += ` ORDER BY m.is_active DESC, m.last_name ASC`;
    const result = await query(sql, params);
    return result.rows;
  }

  static async createMechanicAndLogAudit(data, userId, ipAddress) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertSql = `
        INSERT INTO mechanics (branch_id, first_name, last_name, specialization, contact_number)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const mechanicResult = await client.query(insertSql, [
        data.branch_id,
        data.first_name,
        data.last_name,
        data.specialization,
        data.contact_number,
      ]);
      const newMechanic = mechanicResult.rows[0];

      const auditSql = `
        INSERT INTO audit_logs (user_id, branch_id, action, target_resource, target_id, ip_address) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(auditSql, [
        userId,
        data.branch_id, // Log the branch the mechanic was assigned to
        "MECHANIC_CREATED",
        "mechanics",
        newMechanic.id,
        ipAddress,
      ]);

      await client.query("COMMIT");
      return newMechanic;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateMechanicAndLogAudit(
    id,
    updates,
    targetBranchId,
    userId,
    ipAddress,
  ) {
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
      const updatedMechanic = result.rows[0];

      const auditSql = `
        INSERT INTO audit_logs (user_id, branch_id, action, target_resource, target_id, ip_address) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(auditSql, [
        userId,
        targetBranchId, // The branch the mechanic currently belongs to (or was transferred to)
        "MECHANIC_UPDATED",
        "mechanics",
        id,
        ipAddress,
      ]);

      await client.query("COMMIT");
      return updatedMechanic;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = MechanicModel;
