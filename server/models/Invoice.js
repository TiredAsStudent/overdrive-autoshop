const { query, pool } = require("../config/db");

class Invoice {
  static async generateInvoiceCode() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `INV-${yearMonth}-`;

    const sql = `SELECT invoice_number FROM invoices WHERE invoice_number LIKE $1 ORDER BY id DESC LIMIT 1`;
    const result = await query(sql, [`${prefix}%`]);

    let sequence = 1;
    if (result.rows[0]) {
      const lastSequence = parseInt(
        result.rows[0].invoice_number.split("-")[2],
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  // ATOMIC BILLING & INVENTORY ENGINE
  static async createFromSalesOrder(
    invoiceData,
    itemsData,
    salesOrderId,
    userId,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert Invoice Header
      const headerSql = `
        INSERT INTO invoices (
          invoice_number, sales_order_id, customer_id, branch_id, 
          subtotal, total_discount, vat_amount, grand_total, 
          due_date, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const headerValues = [
        invoiceData.invoice_number,
        salesOrderId,
        invoiceData.customer_id,
        invoiceData.branch_id,
        invoiceData.subtotal,
        invoiceData.total_discount,
        invoiceData.vat_amount,
        invoiceData.grand_total,
        invoiceData.due_date,
        invoiceData.notes,
        invoiceData.created_by,
      ];
      const headerRes = await client.query(headerSql, headerValues);
      const newInvoice = headerRes.rows[0];

      // 2. Process Line Items AND Inventory Deductions
      for (const item of itemsData) {
        // A. Insert the billing line item
        const itemSql = `
          INSERT INTO invoice_items (
            invoice_id, line_type, service_id, item_id, 
            quantity, recorded_unit_cost, recorded_selling_price, discount_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await client.query(itemSql, [
          newInvoice.id,
          item.line_type,
          item.service_id,
          item.item_id,
          item.quantity,
          item.recorded_unit_cost,
          item.recorded_selling_price,
          item.discount_amount,
        ]);

        // B. Permanent Inventory Deduction Trigger
        if (item.line_type === "PART") {
          // Lock the specific inventory row
          const checkSql = `SELECT quantity FROM branch_inventory WHERE branch_id = $1 AND item_id = $2 FOR UPDATE`;
          const checkRes = await client.query(checkSql, [
            invoiceData.branch_id,
            item.item_id,
          ]);

          if (checkRes.rows.length === 0) {
            throw new Error(
              `Inventory constraint violation. Item ID ${item.item_id} does not exist in branch ledger.`,
            );
          }

          const currentQty = checkRes.rows[0].quantity;
          const newQty = currentQty - item.quantity;

          if (newQty < 0) {
            throw new Error(
              `Critical Stock Error: Cannot generate invoice. Not enough physical stock for Item ID ${item.item_id}.`,
            );
          }

          // Deduct quantity
          const updateStockSql = `UPDATE branch_inventory SET quantity = $1 WHERE branch_id = $2 AND item_id = $3`;
          await client.query(updateStockSql, [
            newQty,
            invoiceData.branch_id,
            item.item_id,
          ]);

          // Write Immutable Movement Ledger
          const ledgerSql = `
            INSERT INTO inventory_movements (
              item_id, branch_id, transaction_type, transaction_reference, 
              quantity_deducted, remaining_quantity, remarks, created_by
            ) VALUES ($1, $2, 'SALES_INVOICE', $3, $4, $5, $6, $7)
          `;
          await client.query(ledgerSql, [
            item.item_id,
            invoiceData.branch_id,
            newInvoice.invoice_number,
            item.quantity,
            newQty,
            `Billed to Customer ID: ${invoiceData.customer_id}`,
            userId,
          ]);
        }
      }

      // 3. Lock Upstream Sales Order Status
      const updateSOSql = `UPDATE sales_orders SET status = 'INVOICED', updated_at = NOW() WHERE id = $1`;
      await client.query(updateSOSql, [salesOrderId]);

      await client.query("COMMIT");
      return newInvoice;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const sql = `
      SELECT i.*, c.full_name as customer_name, c.contact_number, c.email, c.address as customer_address, 
             b.branch_name, u.first_name as created_by_name, so.sales_order_number
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN branches b ON i.branch_id = b.id
      LEFT JOIN sales_orders so ON i.sales_order_id = so.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = $1
    `;
    const result = await query(sql, [id]);
    const invoice = result.rows[0];
    if (!invoice) return null;

    const itemsSql = `
      SELECT ii.*, s.service_code, s.service_name, inv.sku, inv.item_name
      FROM invoice_items ii
      LEFT JOIN services s ON ii.service_id = s.id
      LEFT JOIN inventory_items inv ON ii.item_id = inv.id
      WHERE ii.invoice_id = $1
    `;
    const itemsResult = await query(itemsSql, [id]);
    invoice.items = itemsResult.rows;
    return invoice;
  }

  static async update(id, data) {
    const sql = `
      UPDATE invoices 
      SET 
        due_date = COALESCE($1, due_date),
        notes = COALESCE($2, notes),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await query(sql, [data.due_date, data.notes, id]);
    return result.rows[0];
  }

  static async countFiltered(search, status, branchId) {
    let sql = `SELECT COUNT(DISTINCT i.id) FROM invoices i JOIN customers c ON i.customer_id = c.id`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(i.invoice_number ILIKE $${paramIdx} OR c.full_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      conditions.push(`i.status = $${paramIdx}`);
      values.push(status.toUpperCase());
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`i.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedFiltered(limit, offset, search, status, branchId) {
    let sql = `
      SELECT i.id, i.invoice_number, i.grand_total, i.amount_paid, i.status, i.due_date, i.created_at,
             c.full_name as customer_name, b.branch_name
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN branches b ON i.branch_id = b.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(i.invoice_number ILIKE $${paramIdx} OR c.full_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      conditions.push(`i.status = $${paramIdx}`);
      values.push(status.toUpperCase());
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`i.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY i.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = Invoice;
