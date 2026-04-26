const { query, pool } = require("../config/db");

class EstimateModel {
  static async getBranchEstimates(branchId) {
    const sql = `
      SELECT 
        bt.id, bt.reference_number, bt.status, bt.total_amount, bt.tax_amount, 
        bt.created_at, bt.expires_at,
        jc.id AS job_card_id,
        u.first_name || ' ' || u.last_name AS customer_name,
        v.plate_number
      FROM billing_transactions bt
      JOIN job_cards jc ON bt.job_card_id = jc.id
      JOIN users u ON bt.customer_id = u.id
      JOIN vehicles v ON jc.vehicle_id = v.id
      WHERE bt.branch_id = $1 AND bt.type = 'ESTIMATE'
      ORDER BY bt.created_at DESC
    `;
    const result = await query(sql, [branchId]);
    return result.rows;
  }

  static async getEstimateById(id, branchId) {
    const headerSql = `SELECT * FROM billing_transactions WHERE id = $1 AND branch_id = $2 AND type = 'ESTIMATE'`;
    const itemsSql = `SELECT * FROM billing_items WHERE transaction_id = $1`;

    const [headerRes, itemsRes] = await Promise.all([
      query(headerSql, [id, branchId]),
      query(itemsSql, [id]),
    ]);

    if (headerRes.rows.length === 0) return null;
    return { ...headerRes.rows[0], items: itemsRes.rows };
  }

  static async createEstimate(headerData, items, branchCode) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert Header
      const headerSql = `
        INSERT INTO billing_transactions 
        (job_card_id, branch_id, customer_id, type, status, total_amount, tax_amount, expires_at)
        VALUES ($1, $2, $3, 'ESTIMATE', 'DRAFT', $4, $5, $6)
        RETURNING id
      `;
      const headerRes = await client.query(headerSql, [
        headerData.job_card_id,
        headerData.branch_id,
        headerData.customer_id,
        headerData.total_amount,
        headerData.tax_amount,
        headerData.expires_at,
      ]);
      const newEstimateId = headerRes.rows[0].id;

      // 2. Generate and Update Custom Reference Number (e.g., EST-BIN-1001)
      const refNumber = `EST-${branchCode.toUpperCase()}-${1000 + newEstimateId}`;
      await client.query(
        `UPDATE billing_transactions SET reference_number = $1 WHERE id = $2`,
        [refNumber, newEstimateId],
      );

      // 3. Bulk Insert Line Items
      const itemValues = items
        .map(
          (_, i) =>
            `($1, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6}, $${i * 6 + 7})`,
        )
        .join(", ");

      const itemParams = [newEstimateId];
      items.forEach((item) => {
        itemParams.push(
          item.inventory_id || null,
          item.description,
          item.quantity,
          item.unit_cost,
          item.total_price,
          item.is_labor,
        );
      });

      const itemsSql = `
        INSERT INTO billing_items 
        (transaction_id, inventory_id, description, quantity, unit_cost, total_price, is_labor) 
        VALUES ${itemValues}
      `;
      await client.query(itemsSql, itemParams);

      await client.query("COMMIT");
      return { id: newEstimateId, reference_number: refNumber };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateStatus(id, branchId, status) {
    const sql = `
      UPDATE billing_transactions 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 AND branch_id = $3 AND type = 'ESTIMATE'
      RETURNING id, status, reference_number
    `;
    const result = await query(sql, [status, id, branchId]);
    return result.rows[0];
  }
}

module.exports = EstimateModel;
