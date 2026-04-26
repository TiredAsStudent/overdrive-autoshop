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
    const headerSql = `
      SELECT 
        bt.*, 
        jc.check_in_odometer, jc.diagnostic_notes,
        v.plate_number, v.make, v.model, v.year,
        u.first_name || ' ' || u.last_name AS customer_name,
        u.email AS customer_email,
        b.branch_name, b.branch_code, b.address, b.tin, b.contact_number
      FROM billing_transactions bt
      JOIN job_cards jc ON bt.job_card_id = jc.id
      JOIN vehicles v ON jc.vehicle_id = v.id
      JOIN users u ON bt.customer_id = u.id
      JOIN branches b ON bt.branch_id = b.id
      WHERE bt.id = $1 AND bt.branch_id = $2 AND bt.type = 'ESTIMATE'
    `;
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

      const refNumber = `EST-${branchCode.toUpperCase()}-${1000 + newEstimateId}`;
      await client.query(
        `UPDATE billing_transactions SET reference_number = $1 WHERE id = $2`,
        [refNumber, newEstimateId],
      );

      const itemValues = items
        .map(
          (_, i) =>
            `($1, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7}, $${i * 7 + 8})`,
        )
        .join(", ");

      const itemParams = [newEstimateId];
      items.forEach((item) => {
        itemParams.push(
          item.inventory_id || null,
          item.description,
          item.quantity,
          item.unit_cost,
          item.base_cost || 0.0,
          item.total_price,
          item.is_labor,
        );
      });

      const itemsSql = `
        INSERT INTO billing_items 
        (transaction_id, inventory_id, description, quantity, unit_cost, base_cost, total_price, is_labor) 
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

  static async convertToSalesOrder(estimateId, branchId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Get the items tied to this estimate
      const itemsRes = await client.query(
        `SELECT * FROM billing_items WHERE transaction_id = $1`,
        [estimateId],
      );
      const items = itemsRes.rows;

      // 2. Reserve Inventory (Changes them to "Blue Status" in the stockroom)
      for (const item of items) {
        if (!item.is_labor && item.inventory_id) {
          const qtyToReserve = parseInt(item.quantity, 10);

          await client.query(
            `UPDATE branch_inventory 
             SET reserved_quantity = reserved_quantity + $1 
             WHERE inventory_id = $2 AND branch_id = $3`,
            [qtyToReserve, item.inventory_id, branchId],
          );
        }
      }

      // 3. Convert Transaction Type and Status
      const updateTxSql = `
        UPDATE billing_transactions 
        SET type = 'SALES_ORDER', status = 'APPROVED', updated_at = NOW() 
        WHERE id = $1 AND branch_id = $2 
        RETURNING job_card_id, reference_number
      `;
      const txRes = await client.query(updateTxSql, [estimateId, branchId]);
      const jobCardId = txRes.rows[0].job_card_id;

      // 4. Kanban Sync: Automatically shift the Job Card to "ONGOING"
      await client.query(
        `UPDATE job_cards SET status = 'ONGOING', updated_at = NOW() WHERE id = $1 AND status = 'PENDING'`,
        [jobCardId],
      );

      await client.query("COMMIT");
      return txRes.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = EstimateModel;
