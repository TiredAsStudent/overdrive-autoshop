const db = require("../config/db");

class KanbanModel {
  // Fetch all active WIP jobs for the branch, including the assigned mechanic's name
  static async getActiveBoard(branchId, client = db) {
    const query = `
      SELECT 
        e.id as estimate_id,
        e.customer_name,
        e.vehicle_plate,
        e.garage_status,
        e.mechanic_id,
        u.first_name AS mechanic_first_name,
        u.last_name AS mechanic_last_name,
        e.grand_total,
        e.updated_at
      FROM estimates e
      LEFT JOIN users u ON e.mechanic_id = u.id
      WHERE e.branch_id = $1 AND e.status = 'WIP'
      ORDER BY e.updated_at DESC;
    `;
    const result = await client.query(query, [branchId]);
    return result.rows;
  }

  // Update the card's column (status) and assigned mechanic
  static async updateCardParams(
    estimateId,
    branchId,
    garageStatus,
    mechanicId,
    client = db,
  ) {
    const query = `
      UPDATE estimates
      SET 
        garage_status = COALESCE($1, garage_status),
        mechanic_id = COALESCE($2, mechanic_id),
        updated_at = NOW()
      WHERE id = $3 AND branch_id = $4 AND status = 'WIP'
      RETURNING *;
    `;
    const values = [
      garageStatus || null,
      mechanicId || null,
      estimateId,
      branchId,
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  }
}

module.exports = KanbanModel;
