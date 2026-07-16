const { query, pool } = require("../config/db");

class Payment {
  static async generatePaymentCode() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `PAY-${yearMonth}-`;

    const sql = `SELECT payment_number FROM payments WHERE payment_number LIKE $1 ORDER BY id DESC LIMIT 1`;
    const result = await query(sql, [`${prefix}%`]);

    let sequence = 1;
    if (result.rows[0]) {
      const lastSequence = parseInt(
        result.rows[0].payment_number.split("-")[2],
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  // ATOMIC CASH COLLECTION & ASSET LIQUIDATION ENGINE
  static async recordPaymentTransaction(paymentData, userId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Lock the Target Invoice (Prevents Concurrent Over-Payment Race Conditions)
      const lockSql = `SELECT grand_total, amount_paid, branch_id FROM invoices WHERE id = $1 FOR UPDATE`;
      const lockRes = await client.query(lockSql, [paymentData.invoice_id]);

      if (lockRes.rows.length === 0) {
        throw new Error("Invoice record not found.");
      }

      const invoice = lockRes.rows[0];
      const outstandingBalance =
        parseFloat(invoice.grand_total) - parseFloat(invoice.amount_paid);

      // VR-04 & BR-05: Prevent Overpayment
      if (outstandingBalance <= 0) {
        throw new Error("This invoice has already been fully paid.");
      }

      const paymentAmount = parseFloat(paymentData.amount_received);
      if (paymentAmount > outstandingBalance) {
        throw new Error(
          `Payment rejected. The amount (₱${paymentAmount}) exceeds the remaining balance (₱${outstandingBalance}).`,
        );
      }

      // 2. Generate Payment Sequence & Insert Record
      paymentData.payment_number = await this.generatePaymentCode();
      const insertSql = `
        INSERT INTO payments (
          payment_number, invoice_id, branch_id, amount_received, 
          payment_method, reference_number, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const insertValues = [
        paymentData.payment_number,
        paymentData.invoice_id,
        invoice.branch_id,
        paymentAmount,
        paymentData.payment_method,
        paymentData.reference_number,
        paymentData.notes,
        userId,
      ];
      const insertRes = await client.query(insertSql, insertValues);
      const newPayment = insertRes.rows[0];

      // 3. Increment Invoice amount_paid and Compute New Status natively in PostgreSQL
      // This neutralizes JS floating-point issues by forcing the DB to handle the exact decimal math.
      const updateInvoiceSql = `
        UPDATE invoices 
        SET 
          amount_paid = amount_paid + $1,
          status = CASE 
                     WHEN (amount_paid + $1) >= grand_total THEN 'PAID'::invoice_payment_status_enum
                     ELSE 'PARTIALLY_PAID'::invoice_payment_status_enum
                   END,
          updated_at = NOW()
        WHERE id = $2
        RETURNING status, amount_paid, grand_total
      `;
      const updateRes = await client.query(updateInvoiceSql, [
        paymentAmount,
        paymentData.invoice_id,
      ]);
      const updatedInvoice = updateRes.rows[0];

      await client.query("COMMIT");

      return { payment: newPayment, updatedInvoice };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const sql = `
      SELECT p.*, i.invoice_number, i.grand_total as invoice_total, c.full_name as customer_name,
             u.first_name as created_by_name, b.branch_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      JOIN branches b ON p.branch_id = b.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async countFiltered(search, method, branchId) {
    let sql = `
      SELECT COUNT(DISTINCT p.id) 
      FROM payments p 
      JOIN invoices i ON p.invoice_id = i.id 
      JOIN customers c ON i.customer_id = c.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(p.payment_number ILIKE $${paramIdx} OR i.invoice_number ILIKE $${paramIdx} OR c.full_name ILIKE $${paramIdx} OR p.reference_number ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (method && method !== "all") {
      conditions.push(`p.payment_method = $${paramIdx}`);
      values.push(method.toUpperCase());
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`p.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedFiltered(limit, offset, search, method, branchId) {
    let sql = `
      SELECT p.id, p.payment_number, p.amount_received, p.payment_method, p.created_at, p.reference_number,
             i.invoice_number, i.status as current_invoice_status, c.full_name as customer_name, b.branch_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      JOIN branches b ON p.branch_id = b.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(p.payment_number ILIKE $${paramIdx} OR i.invoice_number ILIKE $${paramIdx} OR c.full_name ILIKE $${paramIdx} OR p.reference_number ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (method && method !== "all") {
      conditions.push(`p.payment_method = $${paramIdx}`);
      values.push(method.toUpperCase());
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`p.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY p.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = Payment;
