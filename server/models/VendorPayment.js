const { query, pool } = require("../config/db");

class VendorPayment {
  static async generatePaymentCode() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `VPAY-${yearMonth}-`;

    const sql = `SELECT payment_number FROM vendor_payments WHERE payment_number LIKE $1 ORDER BY id DESC LIMIT 1`;
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

  static async recordPaymentTransaction(paymentData, userId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Lock the parent bill for concurrency safety AND fetch vendor_id
      const lockSql = `SELECT id, grand_total, amount_paid, branch_id, status, payment_status, vendor_id 
                       FROM bills WHERE id = $1 FOR UPDATE`;
      const lockRes = await client.query(lockSql, [paymentData.bill_id]);

      if (lockRes.rows.length === 0) {
        throw new Error("Target Bill not found.");
      }

      const bill = lockRes.rows[0];

      if (
        parseInt(bill.vendor_id, 10) !== parseInt(paymentData.vendor_id, 10)
      ) {
        throw new Error(
          "Security Violation: The target bill does not belong to the selected vendor.",
        );
      }

      // BR-04 Enforcement: Goods must be received before paying
      if (bill.status !== "RECEIVED") {
        throw new Error(
          "Payment rejected. Bill goods have not been confirmed as RECEIVED.",
        );
      }

      const outstandingBalance =
        parseFloat(bill.grand_total) - parseFloat(bill.amount_paid);

      // Prevent Overpayment
      if (outstandingBalance <= 0) {
        throw new Error("This bill has already been fully paid.");
      }

      const paymentAmount = parseFloat(paymentData.amount_paid);
      if (paymentAmount > outstandingBalance) {
        throw new Error(
          `Payment rejected. The amount (₱${paymentAmount}) exceeds the remaining balance (₱${outstandingBalance}).`,
        );
      }

      paymentData.payment_number = await this.generatePaymentCode();
      const targetDate =
        paymentData.payment_date || new Date().toISOString().split("T")[0];

      // 2. Insert the Payment
      const insertSql = `
        INSERT INTO vendor_payments (
          payment_number, vendor_id, bill_id, branch_id, amount_paid, 
          payment_method, reference_number, notes, created_by, payment_date, proof_of_payment_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const insertValues = [
        paymentData.payment_number,
        paymentData.vendor_id,
        paymentData.bill_id,
        bill.branch_id,
        paymentAmount,
        paymentData.payment_method,
        paymentData.reference_number,
        paymentData.notes,
        userId,
        targetDate,
        paymentData.proof_of_payment_url || null,
      ];
      const insertRes = await client.query(insertSql, insertValues);
      const newPayment = insertRes.rows[0];

      // 3. Update the Bill's Payment Status Atomically
      const updateBillSql = `
        UPDATE bills 
        SET 
          amount_paid = amount_paid + $1,
          payment_status = CASE 
                             WHEN (amount_paid + $1) >= grand_total THEN 'PAID'::bill_payment_status_enum
                             ELSE 'PARTIALLY_PAID'::bill_payment_status_enum
                           END,
          updated_at = NOW()
        WHERE id = $2
        RETURNING payment_status, amount_paid, grand_total
      `;
      const updateRes = await client.query(updateBillSql, [
        paymentAmount,
        paymentData.bill_id,
      ]);
      const updatedBill = updateRes.rows[0];

      await client.query("COMMIT");
      return { payment: newPayment, updatedBill };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const sql = `
      SELECT vp.*, TO_CHAR(vp.payment_date, 'YYYY-MM-DD') as payment_date, 
             b.bill_number, b.grand_total as bill_total, b.vendor_invoice_number, 
             b.payment_status as current_bill_status, b.amount_paid as bill_amount_paid,
             v.business_name as vendor_name, v.vendor_code,
             u.first_name as created_by_name, br.branch_name
      FROM vendor_payments vp
      JOIN bills b ON vp.bill_id = b.id
      JOIN vendors v ON vp.vendor_id = v.id
      JOIN branches br ON vp.branch_id = br.id
      LEFT JOIN users u ON vp.created_by = u.id
      WHERE vp.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async countFiltered(search, method, branchId, vendorId) {
    let sql = `
      SELECT COUNT(DISTINCT vp.id) 
      FROM vendor_payments vp 
      JOIN bills b ON vp.bill_id = b.id 
      JOIN vendors v ON vp.vendor_id = v.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(vp.payment_number ILIKE $${paramIdx} OR b.bill_number ILIKE $${paramIdx} OR v.business_name ILIKE $${paramIdx} OR vp.reference_number ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (method && method !== "all") {
      conditions.push(`vp.payment_method = $${paramIdx}`);
      values.push(method.toUpperCase());
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`vp.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }
    if (vendorId && vendorId !== "all") {
      conditions.push(`vp.vendor_id = $${paramIdx}`);
      values.push(vendorId);
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
    method,
    branchId,
    vendorId,
  ) {
    const sqlParts = [];
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    sqlParts.push(`
      SELECT vp.id, vp.payment_number, vp.amount_paid, vp.payment_method, 
             TO_CHAR(vp.payment_date, 'YYYY-MM-DD') as payment_date, 
             vp.created_at, vp.reference_number, vp.proof_of_payment_url,
             b.bill_number, b.payment_status as current_bill_status, 
             v.business_name as vendor_name, br.branch_name
      FROM vendor_payments vp
      JOIN bills b ON vp.bill_id = b.id
      JOIN vendors v ON vp.vendor_id = v.id
      JOIN branches br ON vp.branch_id = br.id
    `);

    if (search) {
      conditions.push(
        `(vp.payment_number ILIKE $${paramIdx} OR b.bill_number ILIKE $${paramIdx} OR v.business_name ILIKE $${paramIdx} OR vp.reference_number ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (method && method !== "all") {
      conditions.push(`vp.payment_method = $${paramIdx}`);
      values.push(method.toUpperCase());
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`vp.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }
    if (vendorId && vendorId !== "all") {
      conditions.push(`vp.vendor_id = $${paramIdx}`);
      values.push(vendorId);
      paramIdx++;
    }

    if (conditions.length > 0)
      sqlParts.push(` WHERE ` + conditions.join(" AND "));

    sqlParts.push(
      ` ORDER BY vp.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    );
    values.push(limit, offset);

    const result = await query(sqlParts.join(""), values);
    return result.rows;
  }

  static async findEligibleBillsByVendor(vendorId) {
    const sql = `
      SELECT id, bill_number, vendor_invoice_number, grand_total, amount_paid, 
             (grand_total - amount_paid) as remaining_balance, payment_status
      FROM bills 
      WHERE vendor_id = $1 
        AND status = 'RECEIVED' 
        AND payment_status IN ('UNPAID', 'PARTIALLY_PAID')
      ORDER BY created_at ASC
    `;
    const result = await query(sql, [vendorId]);
    return result.rows;
  }
}

module.exports = VendorPayment;
