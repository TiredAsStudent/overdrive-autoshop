const { query } = require("../config/db");

class ReceivablesReport {
  static buildFilterConditions(filters) {
    const conditions = ["i.status != 'VOID'"];
    const values = [];
    let paramIdx = 1;

    if (filters.branch && filters.branch !== "all") {
      conditions.push(`i.branch_id = $${paramIdx}`);
      values.push(parseInt(filters.branch, 10));
      paramIdx++;
    }

    if (filters.customer_id && filters.customer_id !== "all") {
      conditions.push(`i.customer_id = $${paramIdx}`);
      values.push(parseInt(filters.customer_id, 10));
      paramIdx++;
    }

    if (filters.start_date) {
      conditions.push(`i.created_at >= $${paramIdx}::timestamp`);
      values.push(`${filters.start_date} 00:00:00`);
      paramIdx++;
    }

    if (filters.end_date) {
      conditions.push(`i.created_at <= $${paramIdx}::timestamp`);
      values.push(`${filters.end_date} 23:59:59.999`);
      paramIdx++;
    }

    // Default AR behavior: show outstanding unless "all" or "PAID" is explicitly requested
    if (filters.payment_status && filters.payment_status !== "all") {
      if (filters.payment_status === "OVERDUE") {
        conditions.push(
          `i.status IN ('UNPAID', 'PARTIALLY_PAID') AND i.due_date < CURRENT_DATE`,
        );
      } else {
        conditions.push(`i.status = $${paramIdx}`);
        values.push(filters.payment_status.toUpperCase());
        paramIdx++;
      }
    } else {
      conditions.push(`i.status IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE')`);
    }

    // Aging Bucket Filters
    if (filters.aging_category && filters.aging_category !== "all") {
      const bucket = filters.aging_category;
      if (bucket === "CURRENT") {
        conditions.push(`i.due_date >= CURRENT_DATE`);
      } else if (bucket === "1_30_DAYS") {
        conditions.push(`(CURRENT_DATE - i.due_date) BETWEEN 1 AND 30`);
      } else if (bucket === "31_60_DAYS") {
        conditions.push(`(CURRENT_DATE - i.due_date) BETWEEN 31 AND 60`);
      } else if (bucket === "61_90_DAYS") {
        conditions.push(`(CURRENT_DATE - i.due_date) BETWEEN 61 AND 90`);
      } else if (bucket === "OVER_90_DAYS") {
        conditions.push(`(CURRENT_DATE - i.due_date) > 90`);
      }
    }

    if (filters.search) {
      conditions.push(
        `(i.invoice_number ILIKE $${paramIdx} OR c.full_name ILIKE $${paramIdx})`,
      );
      values.push(`%${filters.search}%`);
      paramIdx++;
    }

    return {
      whereClause: `WHERE ` + conditions.join(" AND "),
      values,
      paramIdx,
    };
  }

  static async getExecutiveKPIs(filters) {
    const { whereClause, values } = this.buildFilterConditions(filters);
    const sql = `
      SELECT 
        COUNT(DISTINCT i.id) as open_invoices_count,
        COALESCE(SUM(i.grand_total - i.amount_paid), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN i.due_date < CURRENT_DATE THEN (i.grand_total - i.amount_paid) ELSE 0 END), 0) as total_overdue,
        COALESCE(SUM(CASE WHEN (CURRENT_DATE - i.due_date) > 90 THEN (i.grand_total - i.amount_paid) ELSE 0 END), 0) as high_risk_overdue
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      ${whereClause}
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async getAgingDistribution(filters) {
    const { whereClause, values } = this.buildFilterConditions(filters);
    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN i.due_date >= CURRENT_DATE THEN (i.grand_total - i.amount_paid) ELSE 0 END), 0) as current_balance,
        COALESCE(SUM(CASE WHEN (CURRENT_DATE - i.due_date) BETWEEN 1 AND 30 THEN (i.grand_total - i.amount_paid) ELSE 0 END), 0) as days_1_30,
        COALESCE(SUM(CASE WHEN (CURRENT_DATE - i.due_date) BETWEEN 31 AND 60 THEN (i.grand_total - i.amount_paid) ELSE 0 END), 0) as days_31_60,
        COALESCE(SUM(CASE WHEN (CURRENT_DATE - i.due_date) BETWEEN 61 AND 90 THEN (i.grand_total - i.amount_paid) ELSE 0 END), 0) as days_61_90,
        COALESCE(SUM(CASE WHEN (CURRENT_DATE - i.due_date) > 90 THEN (i.grand_total - i.amount_paid) ELSE 0 END), 0) as days_over_90
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      ${whereClause}
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async getPaginatedLedger(filters, limit, offset) {
    const { whereClause, values, paramIdx } =
      this.buildFilterConditions(filters);
    const sql = `
      SELECT 
        i.id as invoice_id,
        i.invoice_number,
        TO_CHAR(i.created_at, 'YYYY-MM-DD') as invoice_date,
        TO_CHAR(i.due_date, 'YYYY-MM-DD') as due_date,
        c.id as customer_id,
        c.full_name as customer_name,
        b.branch_name,
        i.grand_total as invoice_amount,
        i.amount_paid,
        (i.grand_total - i.amount_paid) as outstanding_balance,
        GREATEST(CURRENT_DATE - i.due_date, 0) as days_overdue,
        CASE 
          WHEN i.status IN ('UNPAID', 'PARTIALLY_PAID') AND i.due_date < CURRENT_DATE THEN 'OVERDUE'
          ELSE i.status::text 
        END as status,
        COUNT(*) OVER() as total_filtered_count
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN branches b ON i.branch_id = b.id
      ${whereClause}
      ORDER BY i.due_date ASC, i.created_at ASC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    values.push(limit, offset);
    const result = await query(sql, values);

    const totalCount =
      result.rows.length > 0
        ? parseInt(result.rows[0].total_filtered_count, 10)
        : 0;
    const ledger = result.rows.map((row) => {
      delete row.total_filtered_count;
      return row;
    });

    return { ledger, totalCount };
  }

  static async getCustomerReceivableDetails(customerId) {
    // 1. Fetch Customer Profile
    const custRes = await query(
      `SELECT id, full_name, contact_number, email FROM customers WHERE id = $1`,
      [customerId],
    );
    if (custRes.rows.length === 0) return null;

    // 2. Fetch Outstanding Invoices
    const invSql = `
      SELECT 
        id, invoice_number, TO_CHAR(created_at, 'YYYY-MM-DD') as invoice_date, 
        TO_CHAR(due_date, 'YYYY-MM-DD') as due_date,
        grand_total, amount_paid, (grand_total - amount_paid) as remaining_balance,
        CASE 
          WHEN status IN ('UNPAID', 'PARTIALLY_PAID') AND due_date < CURRENT_DATE THEN 'OVERDUE'
          ELSE status::text 
        END as status
      FROM invoices 
      WHERE customer_id = $1 AND status IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE') AND status != 'VOID'
      ORDER BY due_date ASC
    `;
    const invoices = (await query(invSql, [customerId])).rows;

    // 3. Fetch Payment History
    const paySql = `
      SELECT 
        p.id, p.payment_number, TO_CHAR(p.payment_date, 'YYYY-MM-DD') as payment_date, 
        p.amount_received, p.payment_method, p.reference_number, p.status,
        i.invoice_number
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE i.customer_id = $1 AND p.status != 'VOID'
      ORDER BY p.payment_date DESC, p.created_at DESC
    `;
    const payments = (await query(paySql, [customerId])).rows;

    return {
      customer: custRes.rows[0],
      outstanding_invoices: invoices,
      payment_history: payments,
    };
  }
}

module.exports = ReceivablesReport;
