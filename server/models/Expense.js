const { query, pool } = require("../config/db");

class Expense {
  static async generateExpenseCode() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `EXP-${yearMonth}-`;

    const sql = `SELECT expense_number FROM expenses WHERE expense_number LIKE $1 ORDER BY id DESC LIMIT 1`;
    const result = await query(sql, [`${prefix}%`]);

    let sequence = 1;
    if (result.rows[0]) {
      const lastSequence = parseInt(
        result.rows[0].expense_number.split("-")[2],
        10,
      );
      sequence = lastSequence + 1;
    }
    return `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  static async create(data) {
    const sql = `
      INSERT INTO expenses (
        expense_number, branch_id, vendor_id, category, description, reference_number,
        expense_date, is_vatable, subtotal, vat_amount, total_amount, payment_method, 
        status, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    const values = [
      data.expense_number,
      data.branch_id,
      data.vendor_id,
      data.category,
      data.description,
      data.reference_number,
      data.expense_date,
      data.is_vatable,
      data.subtotal,
      data.vat_amount,
      data.total_amount,
      data.payment_method,
      data.status,
      data.notes,
      data.created_by,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async update(id, data) {
    const setClauses = [];
    const values = [];
    let paramIdx = 1;

    const fields = [
      "category",
      "description",
      "reference_number",
      "expense_date",
      "is_vatable",
      "subtotal",
      "vat_amount",
      "total_amount",
      "payment_method",
      "notes",
      "status",
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = $${paramIdx}`);
        values.push(data[field]);
        paramIdx++;
      }
    }

    if (data.vendor_id !== undefined) {
      setClauses.push(`vendor_id = $${paramIdx}`);
      values.push(data.vendor_id);
      paramIdx++;
    }

    if (setClauses.length === 0) {
      return (await query(`SELECT * FROM expenses WHERE id = $1`, [id]))
        .rows[0];
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE expenses SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT e.*, v.business_name as vendor_name, b.branch_name, u.first_name as created_by_name
      FROM expenses e
      LEFT JOIN vendors v ON e.vendor_id = v.id
      JOIN branches b ON e.branch_id = b.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async countFiltered(search, status, category, branchId) {
    let sql = `SELECT COUNT(DISTINCT e.id) FROM expenses e LEFT JOIN vendors v ON e.vendor_id = v.id`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(e.expense_number ILIKE $${paramIdx} OR e.description ILIKE $${paramIdx} OR e.reference_number ILIKE $${paramIdx} OR v.business_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      conditions.push(`e.status = $${paramIdx}`);
      values.push(status.toUpperCase());
      paramIdx++;
    }
    if (category && category !== "all") {
      conditions.push(`e.category ILIKE $${paramIdx}`);
      values.push(`%${category}%`);
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`e.branch_id = $${paramIdx}`);
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
    category,
    branchId,
  ) {
    let sql = `
      SELECT e.id, e.expense_number, e.expense_date, e.category, e.description, 
             e.total_amount, e.status, v.business_name as vendor_name, b.branch_name
      FROM expenses e
      LEFT JOIN vendors v ON e.vendor_id = v.id
      JOIN branches b ON e.branch_id = b.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(e.expense_number ILIKE $${paramIdx} OR e.description ILIKE $${paramIdx} OR e.reference_number ILIKE $${paramIdx} OR v.business_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      conditions.push(`e.status = $${paramIdx}`);
      values.push(status.toUpperCase());
      paramIdx++;
    }
    if (category && category !== "all") {
      conditions.push(`e.category ILIKE $${paramIdx}`);
      values.push(`%${category}%`);
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`e.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY e.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  static async processApprovalDecision(id, status, remarks, resolvedBy) {
    let sql;
    const values = [status, resolvedBy, id];

    if (status === "REJECTED") {
      sql = `
        UPDATE expenses 
        SET status = $1, rejection_remarks = $4, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() 
        WHERE id = $3 AND status = 'PENDING_APPROVAL' 
        RETURNING *
      `;
      values.push(remarks);
    } else {
      if (remarks) {
        const remarksAppend = `\n\n[Manager Approval Notes]: ${remarks}`;
        sql = `
          UPDATE expenses 
          SET status = $1, notes = COALESCE(notes, '') || $4, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() 
          WHERE id = $3 AND status = 'PENDING_APPROVAL' 
          RETURNING *
        `;
        values.push(remarksAppend);
      } else {
        sql = `
          UPDATE expenses 
          SET status = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() 
          WHERE id = $3 AND status = 'PENDING_APPROVAL' 
          RETURNING *
        `;
      }
    }

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async countApprovalHistory(search, category, branchId) {
    let sql = `SELECT COUNT(DISTINCT e.id) FROM expenses e LEFT JOIN vendors v ON e.vendor_id = v.id WHERE e.status IN ('APPROVED', 'REJECTED')`;
    const values = [];
    let paramIdx = 1;

    if (search) {
      sql += ` AND (e.expense_number ILIKE $${paramIdx} OR e.description ILIKE $${paramIdx} OR e.reference_number ILIKE $${paramIdx} OR v.business_name ILIKE $${paramIdx})`;
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (category && category !== "all") {
      sql += ` AND e.category ILIKE $${paramIdx}`;
      values.push(`%${category}%`);
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      sql += ` AND e.branch_id = $${paramIdx}`;
      values.push(branchId);
      paramIdx++;
    }

    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedApprovalHistory(
    limit,
    offset,
    search,
    category,
    branchId,
  ) {
    let sql = `
      SELECT e.id, e.expense_number, e.expense_date, e.category, e.description, 
             e.total_amount, e.status, e.resolved_at as processed_at,
             v.business_name as vendor_name, b.branch_name, u.first_name as resolved_by_name
      FROM expenses e
      LEFT JOIN vendors v ON e.vendor_id = v.id
      JOIN branches b ON e.branch_id = b.id
      LEFT JOIN users u ON e.resolved_by = u.id
      WHERE e.status IN ('APPROVED', 'REJECTED')
    `;
    const values = [];
    let paramIdx = 1;

    if (search) {
      sql += ` AND (e.expense_number ILIKE $${paramIdx} OR e.description ILIKE $${paramIdx} OR e.reference_number ILIKE $${paramIdx} OR v.business_name ILIKE $${paramIdx})`;
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (category && category !== "all") {
      sql += ` AND e.category ILIKE $${paramIdx}`;
      values.push(`%${category}%`);
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      sql += ` AND e.branch_id = $${paramIdx}`;
      values.push(branchId);
      paramIdx++;
    }

    sql += ` ORDER BY e.resolved_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  static async createFromVerification(
    scanId,
    data,
    activeUserId,
    activeBranchId,
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const scanRes = await client.query(
        `SELECT * FROM receipt_scans WHERE id = $1 FOR UPDATE`,
        [scanId],
      );
      const scan = scanRes.rows[0];

      if (!scan) throw new Error("Receipt scan session not found.");
      if (scan.branch_id !== activeBranchId)
        throw new Error("Unauthorized: Cross-branch verification denied.");
      if (scan.status !== "PENDING_VERIFICATION") {
        throw new Error(
          `Transaction Rejected: This receipt is currently marked as ${scan.status}.`,
        );
      }

      const expense_number = await this.generateExpenseCode();

      const description = `OCR Verified Expense: ${data.vendor_name}`;

      const insertSql = `
        INSERT INTO expenses (
          expense_number, branch_id, vendor_id, vendor_name, category, description,
          reference_number, expense_date, is_vatable, subtotal, vat_amount, total_amount,
          payment_method, status, scan_id, receipt_url, line_items, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
        RETURNING *
      `;

      const values = [
        expense_number,
        scan.branch_id,
        data.vendor_id || null,
        data.vendor_name,
        data.category,
        description,
        data.receipt_number || null,
        data.expense_date,
        data.is_vatable,
        data.subtotal,
        data.vat_amount,
        data.total_amount,
        data.payment_method,
        "APPROVED",
        scan.id,
        scan.file_path,
        JSON.stringify(data.line_items),
        activeUserId,
      ];

      const expRes = await client.query(insertSql, values);
      const newExpense = expRes.rows[0];

      await client.query(
        `UPDATE receipt_scans SET status = 'VERIFIED', updated_at = NOW() WHERE id = $1`,
        [scan.id],
      );

      await client.query("COMMIT");

      return { newExpense, scan };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Expense;
