const { query, pool } = require("../config/db");

class PurchaseOrder {
  static async generatePOCode() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `PO-${yearMonth}-`;

    const sql = `SELECT purchase_order_number FROM purchase_orders WHERE purchase_order_number LIKE $1 ORDER BY id DESC LIMIT 1`;
    const result = await query(sql, [`${prefix}%`]);

    let sequence = 1;
    if (result.rows[0]) {
      const lastSequence = parseInt(
        result.rows[0].purchase_order_number.split("-")[2],
        10,
      );
      sequence = lastSequence + 1;
    }
    return `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  static async createTransaction(poData, computedItems) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const headerSql = `
        INSERT INTO purchase_orders (
          purchase_order_number, vendor_id, branch_id, subtotal, vat_amount, grand_total, 
          status, expected_delivery_date, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
      `;
      const headerValues = [
        poData.purchase_order_number,
        poData.vendor_id,
        poData.branch_id,
        poData.subtotal,
        poData.vat_amount,
        poData.grand_total,
        poData.status,
        poData.expected_delivery_date,
        poData.notes,
        poData.created_by,
      ];
      const headerRes = await client.query(headerSql, headerValues);
      const newPO = headerRes.rows[0];

      if (computedItems && computedItems.length > 0) {
        let itemSql = `
          INSERT INTO purchase_order_items (
            purchase_order_id, item_id, quantity, recorded_unit_cost, discount_amount
          ) VALUES 
        `;
        const values = [];
        const placeholders = [];
        let paramIdx = 1;

        computedItems.forEach((item) => {
          placeholders.push(
            `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4})`,
          );
          values.push(
            newPO.id,
            item.item_id,
            item.quantity,
            item.recorded_unit_cost,
            item.discount_amount,
          );
          paramIdx += 5;
        });

        itemSql += placeholders.join(", ");
        await client.query(itemSql, values);
      }

      await client.query("COMMIT");
      return newPO;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateTransaction(poId, poData, computedItems) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updateHeaderSql = `
        UPDATE purchase_orders 
        SET subtotal = $1, vat_amount = $2, grand_total = $3, expected_delivery_date = $4, notes = $5, status = $6, updated_at = NOW()
        WHERE id = $7 RETURNING *
      `;
      const updateRes = await client.query(updateHeaderSql, [
        poData.subtotal,
        poData.vat_amount,
        poData.grand_total,
        poData.expected_delivery_date,
        poData.notes,
        poData.status,
        poId,
      ]);
      const updatedPO = updateRes.rows[0];

      if (computedItems && computedItems.length > 0) {
        await client.query(
          `DELETE FROM purchase_order_items WHERE purchase_order_id = $1`,
          [poId],
        );

        let itemSql = `
          INSERT INTO purchase_order_items (
            purchase_order_id, item_id, quantity, recorded_unit_cost, discount_amount
          ) VALUES 
        `;
        const values = [];
        const placeholders = [];
        let paramIdx = 1;

        computedItems.forEach((item) => {
          placeholders.push(
            `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4})`,
          );
          values.push(
            poId,
            item.item_id,
            item.quantity,
            item.recorded_unit_cost,
            item.discount_amount,
          );
          paramIdx += 5;
        });

        itemSql += placeholders.join(", ");
        await client.query(itemSql, values);
      }

      await client.query("COMMIT");
      return updatedPO;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const sql = `
      SELECT po.*, v.business_name as vendor_name, v.contact_person, v.email as vendor_email, 
             b.branch_name, u.first_name as created_by_name
      FROM purchase_orders po
      JOIN vendors v ON po.vendor_id = v.id
      JOIN branches b ON po.branch_id = b.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.id = $1
    `;
    const result = await query(sql, [id]);
    const po = result.rows[0];
    if (!po) return null;

    const itemsSql = `
      SELECT poi.*, i.sku, i.item_name, i.uom
      FROM purchase_order_items poi
      JOIN inventory_items i ON poi.item_id = i.id
      WHERE poi.purchase_order_id = $1
    `;
    const itemsResult = await query(itemsSql, [id]);
    po.items = itemsResult.rows;

    return po;
  }

  static async updateStatus(id, status) {
    const sql = `UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const result = await query(sql, [status, id]);
    return result.rows[0];
  }

  static async countFiltered(search, status, vendorId, branchId) {
    let sql = `SELECT COUNT(DISTINCT po.id) FROM purchase_orders po JOIN vendors v ON po.vendor_id = v.id`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(po.purchase_order_number ILIKE $${paramIdx} OR v.business_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      conditions.push(`po.status = $${paramIdx}`);
      values.push(status.toUpperCase());
      paramIdx++;
    }
    if (vendorId && vendorId !== "all") {
      conditions.push(`po.vendor_id = $${paramIdx}`);
      values.push(vendorId);
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`po.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedFiltered(
    limit,
    offset,
    search,
    status,
    vendorId,
    branchId,
  ) {
    let sql = `
      SELECT po.id, po.purchase_order_number, po.grand_total, po.status, po.expected_delivery_date, po.created_at,
             v.business_name as vendor_name, b.branch_name
      FROM purchase_orders po
      JOIN vendors v ON po.vendor_id = v.id
      JOIN branches b ON po.branch_id = b.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(po.purchase_order_number ILIKE $${paramIdx} OR v.business_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      conditions.push(`po.status = $${paramIdx}`);
      values.push(status.toUpperCase());
      paramIdx++;
    }
    if (vendorId && vendorId !== "all") {
      conditions.push(`po.vendor_id = $${paramIdx}`);
      values.push(vendorId);
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`po.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY po.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = PurchaseOrder;
