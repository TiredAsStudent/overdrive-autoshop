const db = require("../config/db");

class EstimateModel {
  // --- MASTER RECORD ---
  static async createEstimate(
    branchId,
    staffId,
    customerName,
    vehiclePlate,
    totals,
    client = db,
  ) {
    const query = `
      INSERT INTO estimates (branch_id, created_by, customer_name, vehicle_plate, total_parts, total_labor, grand_total)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      branchId,
      staffId,
      customerName,
      vehiclePlate,
      totals.parts,
      totals.labor,
      totals.grand,
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  }

  // --- DETAIL RECORDS (Line Items) ---
  static async addLineItem(estimateId, item, client = db) {
    const query = `
      INSERT INTO estimate_line_items (estimate_id, item_type, reference_id, item_name, quantity, unit_price, subtotal)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      estimateId,
      item.type,
      item.referenceId || null,
      item.name,
      item.quantity,
      item.unitPrice,
      item.subtotal,
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  }

  // --- READ QUOTES ---
  static async getEstimatesByBranch(branchId, client = db) {
    const query = `SELECT * FROM estimates WHERE branch_id = $1 ORDER BY created_at DESC;`;
    const result = await client.query(query, [branchId]);
    return result.rows;
  }

  static async getEstimateWithDetails(estimateId, branchId, client = db) {
    // Get the Header (Ensuring it belongs to this branch)
    const headerQuery = `SELECT * FROM estimates WHERE id = $1 AND branch_id = $2;`;
    const headerResult = await client.query(headerQuery, [
      estimateId,
      branchId,
    ]);

    if (headerResult.rows.length === 0) return null;
    const estimate = headerResult.rows[0];

    // Get the Line Items
    const itemsQuery = `SELECT * FROM estimate_line_items WHERE estimate_id = $1 ORDER BY id ASC;`;
    const itemsResult = await client.query(itemsQuery, [estimateId]);

    estimate.items = itemsResult.rows;
    return estimate;
  }

  // --- THE STATE MACHINE ---
  static async updateEstimateStatus(estimateId, status, client = db) {
    const query = `
      UPDATE estimates SET status = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *;
    `;
    const result = await client.query(query, [status, estimateId]);
    return result.rows[0];
  }
}

module.exports = EstimateModel;
