const { query } = require("../config/db");

class Inventory {
  static async countFilteredItems(search, category, status) {
    let sql = `SELECT COUNT(*) FROM inventory_items`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(item_name ILIKE $${paramIdx} OR sku ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (category && category !== "all") {
      conditions.push(`category = $${paramIdx}`);
      values.push(category);
      paramIdx++;
    }
    if (status === "active") conditions.push(`is_active = TRUE`);
    else if (status === "archived") conditions.push(`is_active = FALSE`);

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");

    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedItems(limit, offset, search, category, status) {
    let sql = `
      SELECT 
        i.*,
        COALESCE(SUM(bi.quantity), 0) AS total_company_quantity
      FROM inventory_items i
      LEFT JOIN branch_inventory bi ON i.id = bi.item_id
    `;

    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(i.item_name ILIKE $${paramIdx} OR i.sku ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (category && category !== "all") {
      conditions.push(`i.category = $${paramIdx}`);
      values.push(category);
      paramIdx++;
    }
    if (status === "active") conditions.push(`i.is_active = TRUE`);
    else if (status === "archived") conditions.push(`i.is_active = FALSE`);

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");

    sql += ` GROUP BY i.id ORDER BY i.is_active DESC, i.item_name ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  static async checkSkuExists(sku) {
    const sql = `SELECT id FROM inventory_items WHERE sku = $1`;
    const result = await query(sql, [sku]);
    return result.rows[0];
  }

  // Cross-Branch Extraction View (Dynamically computes stock status)
  static async getBranchBreakdown(itemId) {
    const sql = `
      SELECT 
        b.id AS branch_id,
        b.branch_name,
        b.branch_code,
        bi.quantity,
        bi.reorder_point,
        bi.last_restock_date,
        CASE
          WHEN bi.quantity = 0 THEN 'Out of Stock'
          WHEN bi.quantity <= bi.reorder_point THEN 'Low Stock'
          ELSE 'In Stock'
        END AS stock_status
      FROM branch_inventory bi
      JOIN branches b ON bi.branch_id = b.id
      WHERE bi.item_id = $1 AND b.is_active = TRUE
      ORDER BY b.branch_name ASC
    `;
    const result = await query(sql, [itemId]);
    return result.rows;
  }
}

module.exports = Inventory;
