const { query, pool } = require("../config/db");

class SalesOrder {
  static async generateSalesOrderCode() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `SO-${yearMonth}-`;

    const sql = `SELECT sales_order_number FROM sales_orders WHERE sales_order_number LIKE $1 ORDER BY id DESC LIMIT 1`;
    const result = await query(sql, [`${prefix}%`]);

    let sequence = 1;
    if (result.rows[0]) {
      const lastSequence = parseInt(
        result.rows[0].sales_order_number.split("-")[2],
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  // Atomic Conversion Pipeline
  static async createFromEstimate(soData, itemsData, estimateId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert Sales Order Header
      const headerSql = `
        INSERT INTO sales_orders (
          sales_order_number, estimate_id, customer_id, branch_id, 
          subtotal, total_discount, vat_amount, grand_total, 
          status, estimated_completion_date, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING_SERVICE', $9, $10, $11)
        RETURNING *
      `;
      const headerValues = [
        soData.sales_order_number,
        estimateId,
        soData.customer_id,
        soData.branch_id,
        soData.subtotal,
        soData.total_discount,
        soData.vat_amount,
        soData.grand_total,
        soData.estimated_completion_date,
        soData.notes,
        soData.created_by,
      ];
      const headerRes = await client.query(headerSql, headerValues);
      const newSO = headerRes.rows[0];

      // 2. Insert Copied Line Items
      for (const item of itemsData) {
        const itemSql = `
          INSERT INTO sales_order_items (
            sales_order_id, line_type, service_id, item_id, 
            quantity, recorded_unit_cost, recorded_selling_price, discount_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await client.query(itemSql, [
          newSO.id,
          item.line_type,
          item.service_id,
          item.item_id,
          item.quantity,
          item.recorded_unit_cost,
          item.recorded_selling_price,
          item.discount_amount,
        ]);
      }

      // 3. Lock Upstream Estimate Status
      const updateEstSql = `UPDATE estimates SET status = 'CONVERTED', updated_at = NOW() WHERE id = $1`;
      await client.query(updateEstSql, [estimateId]);

      await client.query("COMMIT");
      return newSO;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const sql = `
      SELECT so.*, c.full_name as customer_name, c.contact_number, c.email, b.branch_name, u.first_name as created_by_name, e.estimate_number
      FROM sales_orders so
      JOIN customers c ON so.customer_id = c.id
      JOIN branches b ON so.branch_id = b.id
      LEFT JOIN estimates e ON so.estimate_id = e.id
      LEFT JOIN users u ON so.created_by = u.id
      WHERE so.id = $1
    `;
    const result = await query(sql, [id]);
    const so = result.rows[0];
    if (!so) return null;

    const itemsSql = `
      SELECT soi.*, s.service_code, s.service_name, i.sku, i.item_name
      FROM sales_order_items soi
      LEFT JOIN services s ON soi.service_id = s.id
      LEFT JOIN inventory_items i ON soi.item_id = i.id
      WHERE soi.sales_order_id = $1
    `;
    const itemsResult = await query(itemsSql, [id]);
    so.items = itemsResult.rows;
    return so;
  }

  static async update(id, data) {
    const sql = `
      UPDATE sales_orders 
      SET 
        status = COALESCE($1, status),
        estimated_completion_date = COALESCE($2, estimated_completion_date),
        notes = COALESCE($3, notes),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    const result = await query(sql, [
      data.status,
      data.estimated_completion_date,
      data.notes,
      id,
    ]);
    return result.rows[0];
  }

  static async countFiltered(search, status, branchId) {
    let sql = `SELECT COUNT(DISTINCT so.id) FROM sales_orders so JOIN customers c ON so.customer_id = c.id`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(so.sales_order_number ILIKE $${paramIdx} OR c.full_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      conditions.push(`so.status = $${paramIdx}`);
      values.push(status.toUpperCase());
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`so.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedFiltered(limit, offset, search, status, branchId) {
    let sql = `
      SELECT so.id, so.sales_order_number, so.grand_total, so.status, so.estimated_completion_date, so.created_at,
             c.full_name as customer_name, b.branch_name
      FROM sales_orders so
      JOIN customers c ON so.customer_id = c.id
      JOIN branches b ON so.branch_id = b.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(so.sales_order_number ILIKE $${paramIdx} OR c.full_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      conditions.push(`so.status = $${paramIdx}`);
      values.push(status.toUpperCase());
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`so.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY so.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = SalesOrder;
