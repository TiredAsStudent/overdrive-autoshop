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
    if (startDate) {
      conditions.push(`st.created_at >= $${paramIdx}`);
      values.push(`${startDate} 00:00:00`);
      paramIdx++;
    }
    if (endDate) {
      conditions.push(`st.created_at <= $${paramIdx}`);
      values.push(`${endDate} 23:59:59.999`);
      paramIdx++;
    }

    let itemFilterClauses = [];
    if (category && category !== "all") {
      itemFilterClauses.push(`i.category ILIKE $${paramIdx}`);
      values.push(`%${category}%`);
      paramIdx++;
    }
    if (search) {
      itemFilterClauses.push(
        `(i.item_name ILIKE $${paramIdx} OR i.sku ILIKE $${paramIdx} OR st.transfer_reference ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }

    if (itemFilterClauses.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM stock_transfer_items sti 
        JOIN inventory_items i ON sti.item_id = i.id 
        WHERE sti.transfer_id = st.id AND (${itemFilterClauses.join(" AND ")})
      )`);
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
    let sql = `SELECT COUNT(DISTINCT st.id) FROM stock_transfers st`;
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
        st.id, st.transfer_reference, st.total_items, st.total_quantity, st.total_asset_value, st.reason, st.created_at,
        sb.branch_name AS source_branch_name,
        db.branch_name AS destination_branch_name,
        u.first_name, u.last_name
      FROM stock_transfers st
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

  static async findById(id) {
    const headerSql = `
      SELECT st.*, 
             sb.branch_name AS source_branch_name, 
             db.branch_name AS destination_branch_name,
             u.first_name, u.last_name
      FROM stock_transfers st
      JOIN branches sb ON st.source_branch_id = sb.id
      JOIN branches db ON st.destination_branch_id = db.id
      LEFT JOIN users u ON st.created_by = u.id
      WHERE st.id = $1
    `;
    const res = await query(headerSql, [id]);
    const transfer = res.rows[0];

    if (!transfer) return null;

    const itemsSql = `
      SELECT sti.*, i.sku, i.item_name, i.uom, i.category
      FROM stock_transfer_items sti
      JOIN inventory_items i ON sti.item_id = i.id
      WHERE sti.transfer_id = $1
    `;
    transfer.items = (await query(itemsSql, [id])).rows;

    return transfer;
  }

  static async executeTransfer(data, userId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const itemIds = data.items.map((i) => i.item_id).sort((a, b) => a - b);

      const masterRes = await client.query(
        `SELECT id, sku, item_name, unit_cost, is_active FROM inventory_items WHERE id = ANY($1::int[])`,
        [itemIds],
      );
      const masterItemsMap = new Map(masterRes.rows.map((r) => [r.id, r]));

      for (const item of data.items) {
        const master = masterItemsMap.get(item.item_id);
        if (!master)
          throw new Error(
            `CRITICAL: Item ID ${item.item_id} not found in master catalog.`,
          );
        if (!master.is_active)
          throw new Error(
            `Cannot transfer archived item: ${master.sku} - ${master.item_name}`,
          );
      }

      for (const itemId of itemIds) {
        await client.query(
          `INSERT INTO branch_inventory (branch_id, item_id, quantity, reorder_point)
           VALUES ($1, $2, 0, (SELECT default_reorder_level FROM inventory_items WHERE id = $2))
           ON CONFLICT (branch_id, item_id) DO NOTHING`,
          [data.destination_branch_id, itemId],
        );
      }

      const lockRes = await client.query(
        `SELECT branch_id, item_id, quantity 
         FROM branch_inventory 
         WHERE branch_id IN ($1, $2) AND item_id = ANY($3::int[]) 
         ORDER BY branch_id ASC, item_id ASC 
         FOR UPDATE`,
        [data.source_branch_id, data.destination_branch_id, itemIds],
      );

      const inventoryMap = new Map();
      lockRes.rows.forEach((r) =>
        inventoryMap.set(`${r.branch_id}-${r.item_id}`, r.quantity),
      );

      let totalQuantity = 0;
      let totalAssetValue = 0;

      for (const item of data.items) {
        const qty = parseInt(item.quantity, 10);
        const available =
          inventoryMap.get(`${data.source_branch_id}-${item.item_id}`) || 0;
        const master = masterItemsMap.get(item.item_id);

        if (qty > available) {
          throw new Error(
            `Insufficient stock for ${master.sku} (${master.item_name}). Required: ${qty}, Available: ${available} at origin branch.`,
          );
        }
        totalQuantity += qty;
        totalAssetValue += qty * parseFloat(master.unit_cost);
      }

      const refCode = `ST-${Date.now().toString().slice(-6)}`;
      const transferHeaderRes = await client.query(
        `INSERT INTO stock_transfers (transfer_reference, source_branch_id, destination_branch_id, total_items, total_quantity, total_asset_value, reason, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          refCode,
          data.source_branch_id,
          data.destination_branch_id,
          data.items.length,
          totalQuantity,
          totalAssetValue,
          data.reason,
          userId,
        ],
      );
      const transferRecord = transferHeaderRes.rows[0];

      for (const item of data.items) {
        const itemId = item.item_id;
        const qty = parseInt(item.quantity, 10);
        const master = masterItemsMap.get(itemId);

        const newSourceQty =
          (inventoryMap.get(`${data.source_branch_id}-${itemId}`) || 0) - qty;
        const newDestQty =
          (inventoryMap.get(`${data.destination_branch_id}-${itemId}`) || 0) +
          qty;

        await client.query(
          `UPDATE branch_inventory SET quantity = $1 WHERE branch_id = $2 AND item_id = $3`,
          [newSourceQty, data.source_branch_id, itemId],
        );
        await client.query(
          `UPDATE branch_inventory SET quantity = $1, last_restock_date = NOW() WHERE branch_id = $2 AND item_id = $3`,
          [newDestQty, data.destination_branch_id, itemId],
        );

        // Record Manifest Line Item
        await client.query(
          `INSERT INTO stock_transfer_items (transfer_id, item_id, quantity, recorded_unit_cost) VALUES ($1, $2, $3, $4)`,
          [transferRecord.id, itemId, qty, master.unit_cost],
        );

        const ledgerSql = `
          INSERT INTO inventory_movements (item_id, branch_id, transaction_type, transaction_reference, quantity_added, quantity_deducted, remaining_quantity, remarks, recorded_unit_cost, created_by)
          VALUES 
          ($1, $2, 'TRANSFER_OUT', $3, 0, $4, $5, $6, $7, $8),
          ($1, $9, 'TRANSFER_IN', $3, $4, 0, $10, $6, $7, $8)
        `;
        await client.query(ledgerSql, [
          itemId,
          data.source_branch_id,
          refCode,
          qty,
          newSourceQty,
          data.reason,
          master.unit_cost,
          userId,
          data.destination_branch_id,
          newDestQty,
        ]);
      }

      await client.query("COMMIT");
      return transferRecord;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = StockTransfer;
