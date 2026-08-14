const { query, pool } = require("../config/db");

class StockTransfer {
  static buildConditions(
    search,
    sourceBranch,
    destBranch,
    category,
    startDate,
    endDate,
  ) {
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (sourceBranch && sourceBranch !== "all") {
      conditions.push(`st.source_branch_id = $${paramIdx}`);
      values.push(sourceBranch);
      paramIdx++;
    }
    if (destBranch && destBranch !== "all") {
      conditions.push(`st.destination_branch_id = $${paramIdx}`);
      values.push(destBranch);
      paramIdx++;
    }
    if (category && category !== "all") {
      conditions.push(`i.category ILIKE $${paramIdx}`);
      values.push(`%${category}%`);
      paramIdx++;
    }
    if (startDate) {
      conditions.push(`st.created_at >= $${paramIdx}`);
      values.push(`${startDate} 00:00:00`);
      paramIdx++;
    }
    if (endDate) {
      conditions.push(`st.created_at <= $${paramIdx}`);
      values.push(`${endDate} 23:59:59`);
      paramIdx++;
    }
    if (search) {
      conditions.push(
        `(i.item_name ILIKE $${paramIdx} OR i.sku ILIKE $${paramIdx} OR st.transfer_reference ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }

    return { conditions, values, paramIdx };
  }

  static async countFiltered(
    search,
    sourceBranch,
    destBranch,
    category,
    startDate,
    endDate,
  ) {
    let sql = `
      SELECT COUNT(DISTINCT st.id) 
      FROM stock_transfers st
      JOIN inventory_items i ON st.item_id = i.id
    `;
    const { conditions, values } = this.buildConditions(
      search,
      sourceBranch,
      destBranch,
      category,
      startDate,
      endDate,
    );

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginated(
    limit,
    offset,
    search,
    sourceBranch,
    destBranch,
    category,
    startDate,
    endDate,
  ) {
    let sql = `
      SELECT 
        st.id, st.transfer_reference, st.quantity, st.recorded_unit_cost, st.reason, st.created_at,
        i.sku, i.item_name, i.category, i.uom,
        sb.branch_name AS source_branch_name,
        db.branch_name AS destination_branch_name,
        u.first_name, u.last_name
      FROM stock_transfers st
      JOIN inventory_items i ON st.item_id = i.id
      JOIN branches sb ON st.source_branch_id = sb.id
      JOIN branches db ON st.destination_branch_id = db.id
      LEFT JOIN users u ON st.created_by = u.id
    `;
    const { conditions, values, paramIdx } = this.buildConditions(
      search,
      sourceBranch,
      destBranch,
      category,
      startDate,
      endDate,
    );

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY st.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  // The Atomic Transfer Engine
  static async executeTransfer(data, userId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `
        INSERT INTO branch_inventory (branch_id, item_id, quantity, reorder_point)
        VALUES ($1, $2, 0, (SELECT default_reorder_level FROM inventory_items WHERE id = $2))
        ON CONFLICT (branch_id, item_id) DO NOTHING
      `,
        [data.destination_branch_id, data.item_id],
      );

      const lockRes = await client.query(
        `
        SELECT bi.branch_id, bi.quantity, i.unit_cost, i.is_active 
        FROM branch_inventory bi
        JOIN inventory_items i ON bi.item_id = i.id
        WHERE bi.item_id = $1 AND bi.branch_id IN ($2, $3)
        ORDER BY bi.branch_id ASC
        FOR UPDATE
      `,
        [data.item_id, data.source_branch_id, data.destination_branch_id],
      );

      const sourceData = lockRes.rows.find(
        (r) => r.branch_id === data.source_branch_id,
      );
      const destData = lockRes.rows.find(
        (r) => r.branch_id === data.destination_branch_id,
      );

      if (!sourceData)
        throw new Error("Inventory record not found at source branch.");
      if (!destData)
        throw new Error(
          "Critical: Failed to initialize destination inventory row.",
        );

      if (sourceData.is_active === false) {
        throw new Error("Only active inventory items may be transferred.");
      }

      if (sourceData.quantity < data.quantity) {
        throw new Error(
          `Insufficient stock. Cannot transfer ${data.quantity}. Source branch only has ${sourceData.quantity} available.`,
        );
      }

      const newSourceQty = sourceData.quantity - data.quantity;
      const newDestQty = destData.quantity + data.quantity;

      await client.query(
        "UPDATE branch_inventory SET quantity = $1 WHERE branch_id = $2 AND item_id = $3",
        [newSourceQty, data.source_branch_id, data.item_id],
      );

      await client.query(
        "UPDATE branch_inventory SET quantity = $1, last_restock_date = NOW() WHERE branch_id = $2 AND item_id = $3",
        [newDestQty, data.destination_branch_id, data.item_id],
      );

      const refCode = `ST-${Date.now().toString().slice(-6)}`;

      const ledgerSql = `
        INSERT INTO inventory_movements (item_id, branch_id, transaction_type, transaction_reference, quantity_added, quantity_deducted, remaining_quantity, remarks, recorded_unit_cost, created_by)
        VALUES 
        ($1, $2, 'TRANSFER_OUT', $3, 0, $4, $5, $6, $7, $8),
        ($1, $9, 'TRANSFER_IN', $3, $4, 0, $10, $6, $7, $8)
      `;
      await client.query(ledgerSql, [
        data.item_id,
        data.source_branch_id,
        refCode,
        data.quantity,
        newSourceQty,
        data.reason,
        sourceData.unit_cost,
        userId,
        data.destination_branch_id,
        newDestQty,
      ]);

      const transferRes = await client.query(
        `
        INSERT INTO stock_transfers (transfer_reference, item_id, source_branch_id, destination_branch_id, quantity, recorded_unit_cost, reason, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
        [
          refCode,
          data.item_id,
          data.source_branch_id,
          data.destination_branch_id,
          data.quantity,
          sourceData.unit_cost,
          data.reason,
          userId,
        ],
      );

      await client.query("COMMIT");
      return transferRes.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = StockTransfer;
