const { query, pool } = require("../config/db");

class Bill {
  static async generateBillCode() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `BILL-${yearMonth}-`;

    const sql = `SELECT bill_number FROM bills WHERE bill_number LIKE $1 ORDER BY id DESC LIMIT 1`;
    const result = await query(sql, [`${prefix}%`]);

    let sequence = 1;
    if (result.rows[0]) {
      const lastSequence = parseInt(
        result.rows[0].bill_number.split("-")[2],
        10,
      );
      sequence = lastSequence + 1;
    }
    return `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  static async createTransaction(billData, computedItems) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const headerSql = `
        INSERT INTO bills (
          bill_number, purchase_order_id, vendor_id, branch_id, vendor_invoice_number,
          bill_date, date_received, status, subtotal, vat_amount, grand_total, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
      `;

      const dateReceived = billData.status === "RECEIVED" ? new Date() : null;

      const headerValues = [
        billData.bill_number,
        billData.purchase_order_id,
        billData.vendor_id,
        billData.branch_id,
        billData.vendor_invoice_number,
        billData.bill_date,
        dateReceived,
        billData.status,
        billData.subtotal,
        billData.vat_amount,
        billData.grand_total,
        billData.notes,
        billData.created_by,
      ];

      const headerRes = await client.query(headerSql, headerValues);
      const newBill = headerRes.rows[0];

      if (computedItems && computedItems.length > 0) {
        let itemSql = `INSERT INTO bill_items (bill_id, item_id, quantity_received, recorded_unit_cost, discount_amount) VALUES `;
        const values = [];
        const placeholders = [];
        let paramIdx = 1;

        computedItems.forEach((item) => {
          placeholders.push(
            `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4})`,
          );
          values.push(
            newBill.id,
            item.item_id,
            item.quantity_received,
            item.recorded_unit_cost,
            item.discount_amount,
          );
          paramIdx += 5;
        });

        itemSql += placeholders.join(", ");
        await client.query(itemSql, values);
      }

      await client.query("COMMIT");
      return newBill;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // The 5-Step Atomic Transaction for Stock Reception
  static async executeReceiptTransaction(billId, userId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Lock and Verify Bill
      const billRes = await client.query(
        `SELECT * FROM bills WHERE id = $1 FOR UPDATE`,
        [billId],
      );
      const bill = billRes.rows[0];

      if (!bill) throw new Error("Bill not found.");
      if (bill.status !== "PENDING_RECEIPT")
        throw new Error(`Cannot receive a Bill with status: ${bill.status}`);

      // 2. Update Bill Status
      const updateBillSql = `UPDATE bills SET status = 'RECEIVED', date_received = CURRENT_DATE, updated_at = NOW() WHERE id = $1 RETURNING *`;
      const updatedBill = (await client.query(updateBillSql, [billId])).rows[0];

      // 3. Retrieve Items
      const itemsRes = await client.query(
        `SELECT * FROM bill_items WHERE bill_id = $1`,
        [billId],
      );
      const items = itemsRes.rows;

      // 4. Update Inventory & Log Movements
      for (const item of items) {
        const invUpdateSql = `
          UPDATE branch_inventory 
          SET quantity = quantity + $1, last_restock_date = NOW()
          WHERE branch_id = $2 AND item_id = $3
          RETURNING quantity
        `;
        const invRes = await client.query(invUpdateSql, [
          item.quantity_received,
          bill.branch_id,
          item.item_id,
        ]);

        if (invRes.rows.length === 0) {
          throw new Error(
            `Inventory mapping missing for Item ID ${item.item_id} in Branch ${bill.branch_id}`,
          );
        }

        const newQuantity = invRes.rows[0].quantity;

        // Insert Immutable Audit Movement
        const moveSql = `
          INSERT INTO inventory_movements (
            item_id, branch_id, transaction_type, transaction_reference, 
            quantity_added, remaining_quantity, recorded_unit_cost, created_by
          ) VALUES ($1, $2, 'BILL_RECEIVED', $3, $4, $5, $6, $7)
        `;
        await client.query(moveSql, [
          item.item_id,
          bill.branch_id,
          updatedBill.bill_number,
          item.quantity_received,
          newQuantity,
          item.recorded_unit_cost,
          userId,
        ]);
      }

      // 5. Close Parent Purchase Order
      await client.query(
        `UPDATE purchase_orders SET status = 'CLOSED', updated_at = NOW() WHERE id = $1`,
        [bill.purchase_order_id],
      );

      await client.query("COMMIT");
      return updatedBill;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const sql = `
      SELECT b.*, po.purchase_order_number, v.business_name as vendor_name, v.is_vat_registered,
             br.branch_name, u.first_name as created_by_name
      FROM bills b
      JOIN purchase_orders po ON b.purchase_order_id = po.id
      JOIN vendors v ON b.vendor_id = v.id
      JOIN branches br ON b.branch_id = br.id
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.id = $1
    `;
    const result = await query(sql, [id]);
    const bill = result.rows[0];
    if (!bill) return null;

    const itemsSql = `
      SELECT bi.*, i.sku, i.item_name, i.uom
      FROM bill_items bi
      JOIN inventory_items i ON bi.item_id = i.id
      WHERE bi.bill_id = $1
    `;
    bill.items = (await query(itemsSql, [id])).rows;
    return bill;
  }

  static async countFiltered(search, status, vendorId, branchId) {
    let sql = `SELECT COUNT(DISTINCT b.id) FROM bills b JOIN vendors v ON b.vendor_id = v.id JOIN purchase_orders po ON b.purchase_order_id = po.id`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(b.bill_number ILIKE $${paramIdx} OR b.vendor_invoice_number ILIKE $${paramIdx} OR po.purchase_order_number ILIKE $${paramIdx} OR v.business_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      conditions.push(`b.status = $${paramIdx}`);
      values.push(status.toUpperCase());
      paramIdx++;
    }
    if (vendorId && vendorId !== "all") {
      conditions.push(`b.vendor_id = $${paramIdx}`);
      values.push(vendorId);
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`b.branch_id = $${paramIdx}`);
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
      SELECT b.id, b.bill_number, b.vendor_invoice_number, b.grand_total, b.status, b.payment_status, b.bill_date, b.date_received,
             po.purchase_order_number, v.business_name as vendor_name, br.branch_name
      FROM bills b
      JOIN purchase_orders po ON b.purchase_order_id = po.id
      JOIN vendors v ON b.vendor_id = v.id
      JOIN branches br ON b.branch_id = br.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(b.bill_number ILIKE $${paramIdx} OR b.vendor_invoice_number ILIKE $${paramIdx} OR po.purchase_order_number ILIKE $${paramIdx} OR v.business_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      conditions.push(`b.status = $${paramIdx}`);
      values.push(status.toUpperCase());
      paramIdx++;
    }
    if (vendorId && vendorId !== "all") {
      conditions.push(`b.vendor_id = $${paramIdx}`);
      values.push(vendorId);
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`b.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY b.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = Bill;
