const { query } = require("../config/db");

class Inventory {
  static async countFilteredItems(
    search,
    category,
    branch,
    systemStatus,
    stockStatus,
  ) {
    let sql = `
      SELECT COUNT(DISTINCT i.id) 
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
    if (branch && branch !== "all") {
      conditions.push(`bi.branch_id = $${paramIdx}`);
      values.push(branch);
      paramIdx++;
    }
    if (systemStatus === "active") conditions.push(`i.is_active = TRUE`);
    else if (systemStatus === "archived")
      conditions.push(`i.is_active = FALSE`);

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");

    // Aggregate Filtering for Stock Status
    if (stockStatus && stockStatus !== "all") {
      if (stockStatus === "out_of_stock") {
        sql += ` GROUP BY i.id HAVING COALESCE(SUM(bi.quantity), 0) = 0`;
      } else if (stockStatus === "low_stock") {
        sql += ` GROUP BY i.id HAVING COALESCE(SUM(bi.quantity), 0) > 0 AND COALESCE(SUM(bi.quantity), 0) <= COALESCE(SUM(bi.reorder_point), 0)`;
      } else if (stockStatus === "in_stock") {
        sql += ` GROUP BY i.id HAVING COALESCE(SUM(bi.quantity), 0) > COALESCE(SUM(bi.reorder_point), 0)`;
      }
    }

    // If we used GROUP BY (HAVING), we need to wrap the count
    if (sql.includes("GROUP BY")) {
      const wrapSql = `SELECT COUNT(*) FROM (${sql}) AS subquery`;
      const result = await query(wrapSql, values);
      return parseInt(result.rows[0].count, 10);
    }

    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedItems(
    limit,
    offset,
    search,
    category,
    branch,
    systemStatus,
    stockStatus,
  ) {
    let joinClause = `LEFT JOIN branch_inventory bi ON i.id = bi.item_id`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (branch && branch !== "all") {
      joinClause += ` AND bi.branch_id = $${paramIdx}`;
      conditions.push(`bi.branch_id = $${paramIdx}`);
      values.push(branch);
      paramIdx++;
    }

    let sql = `
      SELECT 
        i.*,
        COALESCE(SUM(bi.quantity), 0) AS total_company_quantity,
        COALESCE(SUM(bi.reorder_point), 0) AS total_company_reorder,
        CASE
          WHEN COALESCE(SUM(bi.quantity), 0) = 0 THEN 'Out of Stock'
          WHEN COALESCE(SUM(bi.quantity), 0) <= COALESCE(SUM(bi.reorder_point), 0) THEN 'Low Stock'
          ELSE 'In Stock'
        END AS global_stock_status
      FROM inventory_items i
      ${joinClause}
    `;

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
    if (systemStatus === "active") conditions.push(`i.is_active = TRUE`);
    else if (systemStatus === "archived")
      conditions.push(`i.is_active = FALSE`);

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");

    sql += ` GROUP BY i.id `;

    // FRS 5.4: Apply the HAVING clause for Stock Status filtering
    if (stockStatus && stockStatus !== "all") {
      if (stockStatus === "out_of_stock") {
        sql += ` HAVING COALESCE(SUM(bi.quantity), 0) = 0 `;
      } else if (stockStatus === "low_stock") {
        sql += ` HAVING COALESCE(SUM(bi.quantity), 0) > 0 AND COALESCE(SUM(bi.quantity), 0) <= COALESCE(SUM(bi.reorder_point), 0) `;
      } else if (stockStatus === "in_stock") {
        sql += ` HAVING COALESCE(SUM(bi.quantity), 0) > COALESCE(SUM(bi.reorder_point), 0) `;
      }
    }

    sql += ` ORDER BY i.is_active DESC, i.item_name ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  static async checkSkuExists(sku) {
    const sql = `SELECT id FROM inventory_items WHERE sku = $1`;
    const result = await query(sql, [sku]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `SELECT * FROM inventory_items WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const sql = `
      UPDATE inventory_items 
      SET 
        item_name = COALESCE($1, item_name),
        category = COALESCE($2, category),
        uom = COALESCE($3, uom),
        description = COALESCE($4, description),
        unit_cost = COALESCE($5, unit_cost),
        selling_price = COALESCE($6, selling_price),
        default_reorder_level = COALESCE($7, default_reorder_level),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;
    const values = [
      data.item_name,
      data.category,
      data.uom,
      data.description,
      data.unit_cost,
      data.selling_price,
      data.default_reorder_level,
      id,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async toggleStatus(id, isActive) {
    const sql = `UPDATE inventory_items SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const result = await query(sql, [isActive, id]);
    return result.rows[0];
  }

  static async getBranchBreakdown(itemId) {
    const sql = `
      SELECT 
        b.id AS branch_id,
        b.branch_name,
        b.branch_code,
        COALESCE(bi.quantity, 0) AS quantity,
        COALESCE(bi.reorder_point, 5) AS reorder_point,
        bi.last_restock_date,
        CASE
          WHEN COALESCE(bi.quantity, 0) = 0 THEN 'Out of Stock'
          WHEN COALESCE(bi.quantity, 0) <= COALESCE(bi.reorder_point, 5) THEN 'Low Stock'
          ELSE 'In Stock'
        END AS stock_status
      FROM branches b
      LEFT JOIN branch_inventory bi ON b.id = bi.branch_id AND bi.item_id = $1
      WHERE b.is_active = TRUE
      ORDER BY b.branch_name ASC
    `;
    const result = await query(sql, [itemId]);
    return result.rows;
  }

  static async getMovementHistory(itemId) {
    const sql = `
      SELECT 
        m.id,
        m.transaction_type,
        m.transaction_reference,
        m.quantity_added,
        m.quantity_deducted,
        m.remaining_quantity,
        m.remarks,
        m.created_at,
        b.branch_name,
        u.first_name,
        u.last_name
      FROM inventory_movements m
      JOIN branches b ON m.branch_id = b.id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.item_id = $1
      ORDER BY m.created_at DESC
    `;
    const result = await query(sql, [itemId]);
    return result.rows;
  }
}

module.exports = Inventory;
