const { query } = require("../config/db");

class SalesReport {
  /**
   * Generates the reusable WHERE clause and parameterized values
   */
  static buildFilterConditions(filters) {
    const conditions = ["i.status != 'VOID'"]; // Exclude voided/cancelled transactions
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

    if (filters.payment_status && filters.payment_status !== "all") {
      const pStatus = filters.payment_status;
      if (pStatus === "OVERDUE") {
        conditions.push(
          `i.status IN ('UNPAID', 'PARTIALLY_PAID') AND i.due_date < CURRENT_DATE`,
        );
      } else if (pStatus === "UNPAID" || pStatus === "PARTIALLY_PAID") {
        conditions.push(
          `i.status = $${paramIdx} AND i.due_date >= CURRENT_DATE`,
        );
        values.push(pStatus);
        paramIdx++;
      } else {
        conditions.push(`i.status = $${paramIdx}`);
        values.push(pStatus);
        paramIdx++;
      }
    }

    if (filters.search) {
      conditions.push(
        `(i.invoice_number ILIKE $${paramIdx} OR c.full_name ILIKE $${paramIdx} OR so.sales_order_number ILIKE $${paramIdx})`,
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
        COUNT(DISTINCT i.id) as total_invoices,
        COALESCE(SUM(ii.quantity * ii.recorded_selling_price - ii.discount_amount), 0) as total_net_revenue,
        COALESCE(SUM(CASE WHEN ii.line_type = 'SERVICE' THEN ii.quantity * ii.recorded_selling_price - ii.discount_amount ELSE 0 END), 0) as service_net_revenue,
        COALESCE(SUM(CASE WHEN ii.line_type = 'PART' THEN ii.quantity * ii.recorded_selling_price - ii.discount_amount ELSE 0 END), 0) as parts_net_revenue
      FROM invoices i
      JOIN invoice_items ii ON i.id = ii.invoice_id
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN sales_orders so ON i.sales_order_id = so.id
      ${whereClause}
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async getBranchDistribution(filters) {
    const { whereClause, values } = this.buildFilterConditions(filters);
    const sql = `
      SELECT 
        b.id as branch_id,
        b.branch_name,
        COUNT(DISTINCT i.id) as transaction_count,
        COALESCE(SUM(ii.quantity * ii.recorded_selling_price - ii.discount_amount), 0) as net_revenue
      FROM invoices i
      JOIN invoice_items ii ON i.id = ii.invoice_id
      JOIN branches b ON i.branch_id = b.id
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN sales_orders so ON i.sales_order_id = so.id
      ${whereClause}
      GROUP BY b.id, b.branch_name
      ORDER BY net_revenue DESC
    `;
    const result = await query(sql, values);
    return result.rows;
  }

  static async getServiceDistribution(filters) {
    const { whereClause, values } = this.buildFilterConditions(filters);
    const sql = `
      SELECT 
        s.category as service_category,
        COUNT(DISTINCT i.id) as transaction_count,
        COALESCE(SUM(ii.quantity * ii.recorded_selling_price - ii.discount_amount), 0) as net_revenue
      FROM invoices i
      JOIN invoice_items ii ON i.id = ii.invoice_id
      JOIN services s ON ii.service_id = s.id
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN sales_orders so ON i.sales_order_id = so.id
      ${whereClause} AND ii.line_type = 'SERVICE'
      GROUP BY s.category
      ORDER BY net_revenue DESC
    `;
    const result = await query(sql, values);
    return result.rows;
  }

  static async getPartsDistribution(filters) {
    const { whereClause, values } = this.buildFilterConditions(filters);
    const sql = `
      SELECT 
        inv.category as part_category,
        COUNT(DISTINCT i.id) as transaction_count,
        COALESCE(SUM(ii.quantity * ii.recorded_selling_price - ii.discount_amount), 0) as net_revenue
      FROM invoices i
      JOIN invoice_items ii ON i.id = ii.invoice_id
      JOIN inventory_items inv ON ii.item_id = inv.id
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN sales_orders so ON i.sales_order_id = so.id
      ${whereClause} AND ii.line_type = 'PART'
      GROUP BY inv.category
      ORDER BY net_revenue DESC
    `;
    const result = await query(sql, values);
    return result.rows;
  }

  static async getTopCustomers(filters) {
    const { whereClause, values } = this.buildFilterConditions(filters);
    const sql = `
      SELECT 
        c.id as customer_id,
        c.full_name as customer_name,
        COUNT(DISTINCT i.id) as transaction_count,
        COALESCE(SUM(ii.quantity * ii.recorded_selling_price - ii.discount_amount), 0) as net_revenue
      FROM invoices i
      JOIN invoice_items ii ON i.id = ii.invoice_id
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN sales_orders so ON i.sales_order_id = so.id
      ${whereClause}
      GROUP BY c.id, c.full_name
      ORDER BY net_revenue DESC
      LIMIT 10
    `;
    const result = await query(sql, values);
    return result.rows;
  }

  static async getPaymentStatusDistribution(filters) {
    const { whereClause, values } = this.buildFilterConditions(filters);
    const sql = `
      WITH InvoicesList AS (
        SELECT DISTINCT i.id, i.grand_total,
          CASE 
            WHEN i.status IN ('UNPAID', 'PARTIALLY_PAID') AND i.due_date < CURRENT_DATE THEN 'OVERDUE'
            ELSE i.status::text 
          END as dynamic_status
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        LEFT JOIN sales_orders so ON i.sales_order_id = so.id
        ${whereClause}
      )
      SELECT 
        dynamic_status as status,
        COUNT(id) as invoice_count,
        COALESCE(SUM(grand_total), 0) as total_volume
      FROM InvoicesList
      GROUP BY dynamic_status
    `;
    const result = await query(sql, values);
    return result.rows;
  }

  static async getPaginatedLedger(filters, limit, offset) {
    const { whereClause, values, paramIdx } =
      this.buildFilterConditions(filters);
    const sql = `
      SELECT 
        i.id as invoice_id,
        i.invoice_number,
        TO_CHAR(i.created_at, 'YYYY-MM-DD') as invoice_date,
        c.full_name as customer_name,
        b.branch_name,
        CASE 
          WHEN i.status IN ('UNPAID', 'PARTIALLY_PAID') AND i.due_date < CURRENT_DATE THEN 'OVERDUE'
          ELSE i.status::text 
        END as status,
        (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id AND line_type = 'SERVICE') as service_count,
        (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id AND line_type = 'PART') as part_count,
        COALESCE((SELECT SUM(quantity * recorded_selling_price - discount_amount) FROM invoice_items WHERE invoice_id = i.id), 0) as net_revenue,
        i.grand_total,
        COUNT(*) OVER() as total_filtered_count
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN branches b ON i.branch_id = b.id
      LEFT JOIN sales_orders so ON i.sales_order_id = so.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    values.push(limit, offset);
    const result = await query(sql, values);

    const totalCount =
      result.rows.length > 0
        ? parseInt(result.rows[0].total_filtered_count, 10)
        : 0;
    const transactions = result.rows.map((row) => {
      delete row.total_filtered_count;
      return row;
    });

    return { transactions, totalCount };
  }
}

module.exports = SalesReport;
