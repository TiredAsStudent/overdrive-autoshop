const { query, pool } = require("../../config/db");

class InventoryModel {
  static async checkItemCodeExists(itemCode) {
    const sql = `SELECT id FROM inventory WHERE item_code = $1`;
    const result = await query(sql, [itemCode]);
    return result.rows[0];
  }

  // Gets the Master List AND packages the branch stock levels into an array
  static async getAllInventoryItems() {
    const sql = `
      SELECT 
        i.id, i.item_code, i.item_name, i.category, i.unit_cost, 
        i.reorder_level, i.is_active, i.last_restocked_at,
        COALESCE(
          json_agg(
            json_build_object(
              'branch_id', b.id,
              'branch_name', b.branch_name,
              'stock', bi.stock_quantity,
              'reserved', bi.reserved_quantity
            )
          ) FILTER (WHERE bi.branch_id IS NOT NULL), '[]'
        ) AS branch_levels
      FROM inventory i
      LEFT JOIN branch_inventory bi ON i.id = bi.inventory_id
      LEFT JOIN branches b ON bi.branch_id = b.id
      GROUP BY i.id
      ORDER BY i.category ASC, i.item_name ASC;
    `;
    const result = await query(sql);
    return result.rows;
  }

  static async createItemAndLogAudit(data, userId, ipAddress) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert into Master Inventory
      const insertSql = `
        INSERT INTO inventory (item_code, item_name, category, unit_cost, reorder_level)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      const result = await client.query(insertSql, [
        data.item_code,
        data.item_name,
        data.category,
        data.unit_cost,
        data.reorder_level,
      ]);
      const newId = result.rows[0].id;

      // 2. Automatically create stock trackers (0 stock) for ALL existing branches
      const branchResult = await client.query("SELECT id FROM branches");
      if (branchResult.rows.length > 0) {
        const branchValues = branchResult.rows
          .map((_, index) => `($1, $${index + 2}, 0, 0)`)
          .join(", ");

        const branchParams = [newId, ...branchResult.rows.map((b) => b.id)];
        await client.query(
          `INSERT INTO branch_inventory (inventory_id, branch_id, stock_quantity, reserved_quantity) VALUES ${branchValues}`,
          branchParams,
        );
      }

      // 3. Log Audit
      await client.query(
        `INSERT INTO audit_logs (user_id, action, target_resource, target_id, ip_address) VALUES ($1, $2, $3, $4, $5)`,
        [userId, "INVENTORY_ITEM_CREATED", "inventory", newId, ipAddress],
      );

      await client.query("COMMIT");
      return { id: newId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateItem(id, updates, userId, ipAddress) {
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

      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        const sql = `UPDATE inventory SET ${fields.join(", ")} WHERE id = $1`;
        await client.query(sql, params);
      }

      // 2. Log Audit securely within the transaction
      await client.query(
        `INSERT INTO audit_logs (user_id, action, target_resource, target_id, ip_address) VALUES ($1, $2, $3, $4, $5)`,
        [userId, "INVENTORY_ITEM_UPDATED", "inventory", id, ipAddress],
      );

      await client.query("COMMIT");
      return { id };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = InventoryModel;
