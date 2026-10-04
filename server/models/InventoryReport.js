const { query } = require("../config/db");

class InventoryReport {
  static buildSnapshotConditions(filters) {
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (filters.branch && filters.branch !== "all") {
      conditions.push(`bi.branch_id = $${paramIdx}`);
      values.push(parseInt(filters.branch, 10));
      paramIdx++;
    }

    if (filters.category && filters.category !== "all") {
      conditions.push(`i.category = $${paramIdx}`);
      values.push(filters.category);
      paramIdx++;
    }

    if (filters.search) {
      conditions.push(
        `(i.sku ILIKE $${paramIdx} OR i.item_name ILIKE $${paramIdx})`,
      );
      values.push(`%${filters.search}%`);
      paramIdx++;
    }

    if (filters.stock_status && filters.stock_status !== "all") {
      if (filters.stock_status === "OUT_OF_STOCK") {
        conditions.push(`bi.quantity = 0`);
      } else if (filters.stock_status === "LOW_STOCK") {
        conditions.push(
          `bi.quantity > 0 AND bi.quantity <= COALESCE(bi.reorder_point, i.default_reorder_level)`,
        );
      } else if (filters.stock_status === "IN_STOCK") {
        conditions.push(
          `bi.quantity > COALESCE(bi.reorder_point, i.default_reorder_level)`,
        );
      }
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ` + conditions.join(" AND ") : "";
    return { whereClause, values, paramIdx };
  }

  static buildVelocityConditions(filters) {
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (filters.branch && filters.branch !== "all") {
      conditions.push(`im.branch_id = $${paramIdx}`);
      values.push(parseInt(filters.branch, 10));
      paramIdx++;
    }

    if (filters.category && filters.category !== "all") {
      conditions.push(`i.category = $${paramIdx}`);
      values.push(filters.category);
      paramIdx++;
    }

    if (filters.start_date) {
      conditions.push(`im.created_at >= $${paramIdx}::timestamp`);
      values.push(`${filters.start_date} 00:00:00`);
      paramIdx++;
    }

    if (filters.end_date) {
      conditions.push(`im.created_at <= $${paramIdx}::timestamp`);
      values.push(`${filters.end_date} 23:59:59.999`);
      paramIdx++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ` + conditions.join(" AND ") : "";
    return { whereClause, values };
  }

  static async getExecutiveKPIs(filters) {
    const { whereClause, values } = this.buildSnapshotConditions(filters);
    const sql = `
      SELECT 
        COUNT(DISTINCT i.id) as total_items_tracked,
        COALESCE(SUM(bi.quantity), 0) as total_physical_units,
        COALESCE(SUM(bi.quantity * i.unit_cost), 0) as total_asset_value
      FROM branch_inventory bi
      JOIN inventory_items i ON bi.item_id = i.id
      ${whereClause}
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async getBranchDistribution(filters) {
    const { whereClause, values } = this.buildSnapshotConditions(filters);
    const sql = `
      SELECT 
        b.id as branch_id,
        b.branch_name,
        COUNT(DISTINCT i.id) as active_skus,
        COALESCE(SUM(bi.quantity), 0) as total_units,
        COALESCE(SUM(bi.quantity * i.unit_cost), 0) as asset_value
      FROM branch_inventory bi
      JOIN inventory_items i ON bi.item_id = i.id
      JOIN branches b ON bi.branch_id = b.id
      ${whereClause}
      GROUP BY b.id, b.branch_name
      ORDER BY asset_value DESC
    `;
    const result = await query(sql, values);
    return result.rows;
  }

  static async getMovementVelocity(filters) {
    const { whereClause, values } = this.buildVelocityConditions(filters);
    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN im.transaction_type = 'BILL_RECEIVED' THEN im.quantity_added ELSE 0 END), 0) as stock_received,
        COALESCE(SUM(CASE WHEN im.transaction_type = 'SALES_INVOICE' OR (im.transaction_type = 'MANUAL_ADJUSTMENT' AND im.transaction_reference LIKE 'SO:%') THEN im.quantity_deducted ELSE 0 END), 0) as stock_issued,
        COALESCE(SUM(CASE WHEN im.transaction_type = 'MANUAL_ADJUSTMENT' AND im.transaction_reference NOT LIKE 'SO:%' THEN im.quantity_added - im.quantity_deducted ELSE 0 END), 0) as stock_adjustments_net,
        COALESCE(SUM(CASE WHEN im.transaction_type = 'TRANSFER_IN' THEN im.quantity_added ELSE 0 END), 0) as stock_transferred_in,
        COALESCE(SUM(CASE WHEN im.transaction_type = 'TRANSFER_OUT' THEN im.quantity_deducted ELSE 0 END), 0) as stock_transferred_out
      FROM inventory_movements im
      JOIN inventory_items i ON im.item_id = i.id
      ${whereClause}
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async getLowStockCount(filters) {
    const { whereClause, values } = this.buildSnapshotConditions(filters);

    const connector = whereClause ? "AND" : "WHERE";
    const sql = `
      SELECT COUNT(DISTINCT i.id) as low_stock_count
      FROM branch_inventory bi
      JOIN inventory_items i ON bi.item_id = i.id
      ${whereClause} ${connector} bi.quantity <= COALESCE(bi.reorder_point, i.default_reorder_level)
    `;
    const result = await query(sql, values);
    return parseInt(result.rows[0].low_stock_count, 10);
  }

  static async getPaginatedLedger(filters, limit, offset) {
    const { whereClause, values, paramIdx } =
      this.buildSnapshotConditions(filters);
    const sql = `
      SELECT 
        i.id as item_id,
        i.sku,
        i.item_name,
        i.category,
        i.uom,
        i.unit_cost,
        bi.quantity,
        COALESCE(bi.reorder_point, i.default_reorder_level) as reorder_point,
        (bi.quantity * COALESCE(i.unit_cost, 0)) as total_valuation,
        b.branch_name,
        CASE
          WHEN bi.quantity = 0 THEN 'OUT_OF_STOCK'
          WHEN bi.quantity <= COALESCE(bi.reorder_point, i.default_reorder_level) THEN 'LOW_STOCK'
          ELSE 'IN_STOCK'
        END as stock_status,
        bi.last_restock_date,
        COUNT(*) OVER() as total_filtered_count
      FROM branch_inventory bi
      JOIN inventory_items i ON bi.item_id = i.id
      JOIN branches b ON bi.branch_id = b.id
      ${whereClause}
      ORDER BY total_valuation DESC, i.item_name ASC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    values.push(limit, offset);
    const result = await query(sql, values);

    const totalCount =
      result.rows.length > 0
        ? parseInt(result.rows[0].total_filtered_count, 10)
        : 0;
    const items = result.rows.map((row) => {
      delete row.total_filtered_count;
      return row;
    });

    return { items, totalCount };
  }
}

module.exports = InventoryReport;
