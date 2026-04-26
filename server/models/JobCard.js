const { query } = require("../config/db");

class JobCardModel {
  static async findById(id) {
    const sql = `SELECT * FROM job_cards WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async getActiveBoard(branchId) {
    const sql = `
      SELECT 
        jc.id, 
        jc.status, 
        jc.service_intent, 
        jc.check_in_odometer, 
        jc.diagnostic_notes,
        jc.customer_notes,
        jc.started_at,
        jc.completed_at,
        jc.created_at,
        v.plate_number, 
        v.make, 
        v.model,
        u.id AS customer_id,
        u.first_name || ' ' || u.last_name AS customer_name,
        m.id AS mechanic_id,
        m.first_name || ' ' || m.last_name AS mechanic_name,
        bt.type AS billing_type,
        bt.status AS billing_status,
        bt.total_amount AS billing_total
      FROM job_cards jc
      JOIN vehicles v ON jc.vehicle_id = v.id
      JOIN users u ON v.owner_id = u.id
      LEFT JOIN mechanics m ON jc.mechanic_id = m.id
      LEFT JOIN billing_transactions bt ON bt.job_card_id = jc.id AND bt.status != 'CANCELLED'
      WHERE jc.branch_id = $1 AND jc.status != 'CANCELLED'
      ORDER BY jc.created_at ASC
    `;
    const result = await query(sql, [branchId]);
    return result.rows;
  }

  static async updateStatus(id, status) {
    // AUTOMATED TIME-TRACKING LOGIC
    let timeTrackingSql = "";
    if (status === "ONGOING") {
      // Only set started_at if it hasn't been set before (prevents overwriting if they move it back and forth)
      timeTrackingSql = ", started_at = COALESCE(started_at, NOW())";
    } else if (status === "DONE") {
      timeTrackingSql = ", completed_at = COALESCE(completed_at, NOW())";
    }

    const sql = `
      UPDATE job_cards 
      SET status = $1, updated_at = NOW() ${timeTrackingSql}
      WHERE id = $2 
      RETURNING id, status, vehicle_id, started_at, completed_at
    `;
    const result = await query(sql, [status, id]);
    return result.rows[0];
  }

  static async assignMechanic(id, mechanicId) {
    const sql = `
      UPDATE job_cards 
      SET mechanic_id = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, mechanic_id
    `;
    const result = await query(sql, [mechanicId, id]);
    return result.rows[0];
  }

  static async updateDiagnosis(id, notes) {
    const sql = `
      UPDATE job_cards 
      SET diagnostic_notes = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, diagnostic_notes
    `;
    const result = await query(sql, [notes, id]);
    return result.rows[0];
  }
}

module.exports = JobCardModel;
