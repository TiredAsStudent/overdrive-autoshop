const { query } = require("../config/db");

class Inventory {
  static async createItem(data, activeBranches) {
    const sqlItem = `
      INSERT INTO inventory_items (sku, item_name, category, unit_cost, selling_price) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const itemValues = [
      data.sku,
      data.item_name,
      data.category,
      data.unit_cost,
      data.selling_price,
    ];
    const itemResult = await query(sqlItem, itemValues);
    const newItem = itemResult.rows[0];

    for (const branch of activeBranches) {
      const sqlBranch = `
        INSERT INTO branch_inventory (branch_id, item_id, quantity, reorder_point) 
        VALUES ($1, $2, 0, $3)
      `;
      await query(sqlBranch, [
        branch.id,
        newItem.id,
        data.initial_reorder_point,
      ]);
    }

    return newItem;
  }

  static async findById(id) {
    const sql = `SELECT * FROM inventory_items WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findBySku(sku) {
    const sql = `SELECT * FROM inventory_items WHERE sku = $1`;
    const result = await query(sql, [sku]);
    return result.rows[0];
  }

  static async update(id, data) {
    const sql = `
      UPDATE inventory_items 
      SET 
        item_name = COALESCE($1, item_name),
        category = COALESCE($2, category),
        unit_cost = COALESCE($3, unit_cost),
        selling_price = COALESCE($4, selling_price),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $6 RETURNING *
    `;
    const values = [
      data.item_name,
      data.category,
      data.unit_cost,
      data.selling_price,
      data.is_active,
      id,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async getConsolidatedOverview() {
    const sql = `
      SELECT 
        i.id, i.sku, i.item_name, i.category, i.unit_cost, i.selling_price, i.is_active,
        COALESCE(SUM(b.quantity), 0) AS total_quantity,
        (COALESCE(SUM(b.quantity), 0) * i.unit_cost) AS total_asset_value
      FROM inventory_items i
      LEFT JOIN branch_inventory b ON i.id = b.item_id
      WHERE i.is_active = TRUE
      GROUP BY i.id
      ORDER BY i.category ASC, i.item_name ASC
    `;
    const result = await query(sql);
    return result.rows;
  }

  static async getBranchOverview(branchId) {
    const sql = `
      SELECT 
        i.id, i.sku, i.item_name, i.category, i.unit_cost, i.selling_price, i.is_active,
        b.quantity, b.reorder_point,
        (b.quantity * i.unit_cost) AS branch_asset_value,
        CASE WHEN b.quantity <= b.reorder_point THEN true ELSE false END AS is_low_stock
      FROM inventory_items i
      JOIN branch_inventory b ON i.id = b.item_id
      WHERE b.branch_id = $1 AND i.is_active = TRUE
      ORDER BY is_low_stock DESC, i.category ASC, i.item_name ASC
    `;
    const result = await query(sql, [branchId]);
    return result.rows;
  }
}

module.exports = Inventory;
