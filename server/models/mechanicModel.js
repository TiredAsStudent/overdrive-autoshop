const db = require("../config/db");

class MechanicModel {
  static async create(
    branchId,
    firstName,
    lastName,
    specialization,
    client = db,
  ) {
    const query = `
      INSERT INTO mechanics (branch_id, first_name, last_name, specialization)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await client.query(query, [
      branchId,
      firstName,
      lastName,
      specialization,
    ]);
    return result.rows[0];
  }

  static async findAll(client = db) {
    const query = `
      SELECT m.*, b.branch_name 
      FROM mechanics m
      JOIN branches b ON m.branch_id = b.id
      ORDER BY m.branch_id, m.first_name ASC;
    `;
    const result = await client.query(query);
    return result.rows;
  }

  static async findByBranch(branchId, client = db) {
    const query = `
      SELECT id, first_name, last_name, specialization, is_active 
      FROM mechanics 
      WHERE branch_id = $1 AND is_active = TRUE
      ORDER BY first_name ASC;
    `;
    const result = await client.query(query, [branchId]);
    return result.rows;
  }

  static async findById(id, client = db) {
    const query = `SELECT * FROM mechanics WHERE id = $1`;
    const result = await client.query(query, [id]);
    return result.rows[0];
  }

  // --- UPDATE AND SOFT DELETE ---
  static async update(
    id,
    branchId,
    firstName,
    lastName,
    specialization,
    client = db,
  ) {
    const query = `
      UPDATE mechanics 
      SET branch_id = $1, first_name = $2, last_name = $3, specialization = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *;
    `;
    const result = await client.query(query, [
      branchId,
      firstName,
      lastName,
      specialization,
      id,
    ]);
    return result.rows[0];
  }

  static async updateStatus(id, isActive, client = db) {
    const query = `
      UPDATE mechanics 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const result = await client.query(query, [isActive, id]);
    return result.rows[0];
  }
}

module.exports = MechanicModel;
