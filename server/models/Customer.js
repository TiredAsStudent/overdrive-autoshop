const { query } = require("../config/db");

class Customer {
  static async generateCustomerCode() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `CUST-${yearMonth}-`;

    const sql = `SELECT customer_code FROM customers WHERE customer_code LIKE $1 ORDER BY id DESC LIMIT 1`;
    const result = await query(sql, [`${prefix}%`]);

    let sequence = 1;
    if (result.rows[0]) {
      const lastSequence = parseInt(
        result.rows[0].customer_code.split("-")[2],
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  static async checkDuplicate(fullName, contactNumber, excludeId = null) {
    let sql = `SELECT id, full_name, contact_number FROM customers WHERE (full_name ILIKE $1 OR contact_number = $2)`;
    const params = [fullName, contactNumber];

    if (excludeId) {
      sql += ` AND id != $3`;
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async create(data) {
    const sql = `
      INSERT INTO customers (customer_code, full_name, contact_number, email, address, notes, branch_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `;
    const values = [
      data.customer_code,
      data.full_name,
      data.contact_number,
      data.email || null,
      data.address || null,
      data.notes || null,
      data.branch_id,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async countFiltered(search, status, branchId) {
    let sql = `SELECT COUNT(*) FROM customers`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(full_name ILIKE $${paramIdx} OR contact_number ILIKE $${paramIdx} OR customer_code ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status === "active") conditions.push(`is_active = TRUE`);
    else if (status === "archived") conditions.push(`is_active = FALSE`);

    if (branchId && branchId !== "all") {
      conditions.push(`branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedFiltered(limit, offset, search, status, branchId) {
    let sql = `
      SELECT c.*, b.branch_name 
      FROM customers c
      LEFT JOIN branches b ON c.branch_id = b.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(c.full_name ILIKE $${paramIdx} OR c.contact_number ILIKE $${paramIdx} OR c.customer_code ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status === "active") conditions.push(`c.is_active = TRUE`);
    else if (status === "archived") conditions.push(`c.is_active = FALSE`);

    if (branchId && branchId !== "all") {
      conditions.push(`c.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY c.is_active DESC, c.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  static async findById(id) {
    const sql = `
      SELECT c.*, b.branch_name 
      FROM customers c 
      LEFT JOIN branches b ON c.branch_id = b.id 
      WHERE c.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const sql = `
      UPDATE customers 
      SET 
        full_name = COALESCE($1, full_name),
        contact_number = COALESCE($2, contact_number),
        email = COALESCE($3, email),
        address = COALESCE($4, address),
        notes = COALESCE($5, notes),
        is_active = COALESCE($6, is_active),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    const values = [
      data.full_name,
      data.contact_number,
      data.email,
      data.address,
      data.notes,
      data.is_active,
      id,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async getTransactionHistory(customerId) {
    const sql = `
      SELECT 
        'ESTIMATE' as doc_type,
        estimate_number as doc_number,
        created_at as transaction_date,
        grand_total as amount,
        status::text as status
      FROM estimates WHERE customer_id = $1
      
      UNION ALL
      
      SELECT 
        'SALES_ORDER' as doc_type,
        sales_order_number as doc_number,
        created_at as transaction_date,
        grand_total as amount,
        status::text as status
      FROM sales_orders WHERE customer_id = $1
      
      UNION ALL
      
      SELECT 
        'INVOICE' as doc_type,
        invoice_number as doc_number,
        created_at as transaction_date,
        grand_total as amount,
        status::text as status
      FROM invoices WHERE customer_id = $1
      
      UNION ALL
      
      SELECT 
        'PAYMENT' as doc_type,
        p.payment_number as doc_number,
        p.created_at as transaction_date,
        p.amount_received as amount,
        p.status::text as status
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE i.customer_id = $1

      ORDER BY transaction_date DESC
    `;
    const result = await query(sql, [customerId]);
    return result.rows;
  }
}

module.exports = Customer;
