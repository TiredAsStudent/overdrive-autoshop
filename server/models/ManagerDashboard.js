const { query } = require("../config/db");

class ManagerDashboard {
  static buildFilterConditions(filters, dateColumn, prefix = "") {
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (filters.branch && filters.branch !== "all") {
      conditions.push(`${prefix}branch_id = $${paramIdx}::int`);
      values.push(parseInt(filters.branch, 10));
      paramIdx++;
    }

    if (filters.start_date) {
      conditions.push(`${prefix}${dateColumn} >= $${paramIdx}::timestamp`);
      values.push(`${filters.start_date} 00:00:00`);
      paramIdx++;
    }

    if (filters.end_date) {
      conditions.push(`${prefix}${dateColumn} <= $${paramIdx}::timestamp`);
      values.push(`${filters.end_date} 23:59:59.999`);
      paramIdx++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ` + conditions.join(" AND ") : "";
    return { whereClause, values };
  }

  static async getExecutiveKPIs(filters) {
    const invFilters = this.buildFilterConditions(filters, "created_at", "i.");
    const expFilters = this.buildFilterConditions(filters, "expense_date", "");
    const billFilters = this.buildFilterConditions(filters, "bill_date", "b.");
    const cogsFilters = this.buildFilterConditions(
      filters,
      "created_at",
      "im.",
    );

    // Inventory only filters by branch for real-time asset snapshot (ignoring dates)
    const stockFilters =
      filters.branch && filters.branch !== "all"
        ? {
            whereClause: `WHERE bi.branch_id = $1::int`,
            values: [parseInt(filters.branch, 10)],
          }
        : { whereClause: "", values: [] };

    // Parallel execution for the fundamental KPI pillars
    const [salesRes, expenseRes, cogsRes, arRes, apRes, stockRes] =
      await Promise.all([
        // Total Net Sales
        query(
          `
        SELECT COALESCE(SUM(ii.quantity * ii.recorded_selling_price - ii.discount_amount), 0) as total_sales
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        ${invFilters.whereClause ? invFilters.whereClause + " AND " : "WHERE "} i.status != 'VOID'
      `,
          invFilters.values,
        ),

        // Total Operating Expenses (Net of VAT)
        query(
          `
        SELECT COALESCE(SUM(subtotal), 0) as total_expenses
        FROM expenses 
        ${expFilters.whereClause ? expFilters.whereClause + " AND " : "WHERE "} status = 'APPROVED'
      `,
          expFilters.values,
        ),

        // Total Cost of Goods Sold (Shrinkage & Consumption)
        query(
          `
        SELECT COALESCE(SUM((im.quantity_deducted - im.quantity_added) * im.recorded_unit_cost), 0) as total_cogs
        FROM inventory_movements im
        ${cogsFilters.whereClause ? cogsFilters.whereClause + " AND " : "WHERE "} im.transaction_type IN ('MANUAL_ADJUSTMENT', 'SALES_INVOICE')
      `,
          cogsFilters.values,
        ),

        // Accounts Receivable (Outstanding balances)
        query(
          `
        SELECT COALESCE(SUM(grand_total - amount_paid), 0) as total_ar
        FROM invoices i
        ${invFilters.whereClause ? invFilters.whereClause + " AND " : "WHERE "} i.status IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE')
      `,
          invFilters.values,
        ),

        // Accounts Payable (Outstanding balances)
        query(
          `
        SELECT COALESCE(SUM(b.grand_total - b.amount_paid), 0) as total_ap
        FROM bills b
        ${billFilters.whereClause ? billFilters.whereClause + " AND " : "WHERE "} b.status IN ('RECEIVED', 'CLOSED') AND b.payment_status IN ('UNPAID', 'PARTIALLY_PAID')
      `,
          billFilters.values,
        ),

        // Total Inventory Asset Valuation
        query(
          `
        SELECT COALESCE(SUM(bi.quantity * i.unit_cost), 0) as total_inventory_value
        FROM branch_inventory bi
        JOIN inventory_items i ON bi.item_id = i.id
        ${stockFilters.whereClause}
      `,
          stockFilters.values,
        ),
      ]);

    return {
      total_sales: parseFloat(salesRes.rows[0].total_sales),
      total_expenses: parseFloat(expenseRes.rows[0].total_expenses),
      total_cogs: parseFloat(cogsRes.rows[0].total_cogs),
      total_ar: parseFloat(arRes.rows[0].total_ar),
      total_ap: parseFloat(apRes.rows[0].total_ap),
      total_inventory_value: parseFloat(stockRes.rows[0].total_inventory_value),
    };
  }

  static async getActionAlerts(branchFilter) {
    const values = [];
    let branchCondition = "";
    let stockBranchCondition = "";

    if (branchFilter && branchFilter !== "all") {
      branchCondition = `AND branch_id = $1::int`;
      stockBranchCondition = `WHERE bi.branch_id = $1::int`;
      values.push(parseInt(branchFilter, 10));
    }

    // 1. Pending Transaction Counts
    const sqlPending = `
      SELECT 
        (SELECT COUNT(id) FROM purchase_orders WHERE status = 'PENDING_APPROVAL' ${branchCondition}) as pending_pos,
        (SELECT COUNT(id) FROM expenses WHERE status = 'PENDING_APPROVAL' AND scan_id IS NULL ${branchCondition}) as pending_manual_expenses,
        (SELECT COUNT(id) FROM expenses WHERE status = 'PENDING_APPROVAL' AND scan_id IS NOT NULL ${branchCondition}) as pending_ocr_receipts,
        (SELECT COUNT(id) FROM stock_adjustment_requests WHERE status = 'PENDING' ${branchCondition}) as pending_stock_adjustments
    `;

    // 2. Inventory Shortage Alerts
    const sqlStock = `
      SELECT 
        COALESCE(SUM(CASE WHEN bi.quantity = 0 THEN 1 ELSE 0 END), 0) as out_of_stock_count,
        COALESCE(SUM(CASE WHEN bi.quantity > 0 AND bi.quantity <= COALESCE(bi.reorder_point, i.default_reorder_level) THEN 1 ELSE 0 END), 0) as low_stock_count
      FROM branch_inventory bi
      JOIN inventory_items i ON bi.item_id = i.id
      ${stockBranchCondition}
    `;

    // 3. Overdue Liabilities & Receivables
    const sqlOverdue = `
      SELECT 
        (SELECT COUNT(id) FROM invoices WHERE status IN ('UNPAID', 'PARTIALLY_PAID') AND due_date < CURRENT_DATE ${branchCondition}) as overdue_invoices,
        (SELECT COUNT(id) FROM bills WHERE payment_status IN ('UNPAID', 'PARTIALLY_PAID') AND status IN ('RECEIVED', 'CLOSED') AND due_date < CURRENT_DATE ${branchCondition}) as overdue_bills
    `;

    const [pendingRes, stockRes, overdueRes] = await Promise.all([
      query(sqlPending, values),
      query(sqlStock, values),
      query(sqlOverdue, values),
    ]);

    return {
      ...pendingRes.rows[0],
      ...stockRes.rows[0],
      ...overdueRes.rows[0],
    };
  }

  static async getBranchPerformanceDistribution(filters) {
    const values = [];
    let paramIdx = 1;
    let dateConditionI = "";
    let dateConditionE = "";

    if (filters.start_date) {
      dateConditionI += ` AND i.created_at >= $${paramIdx}::timestamp`;
      dateConditionE += ` AND e.expense_date >= $${paramIdx}::timestamp`;
      values.push(`${filters.start_date} 00:00:00`);
      paramIdx++;
    }
    if (filters.end_date) {
      dateConditionI += ` AND i.created_at <= $${paramIdx}::timestamp`;
      dateConditionE += ` AND e.expense_date <= $${paramIdx}::timestamp`;
      values.push(`${filters.end_date} 23:59:59.999`);
      paramIdx++;
    }

    let branchCondition = "";
    if (filters.branch && filters.branch !== "all") {
      branchCondition = ` AND b.id = $${paramIdx}::int`;
      values.push(parseInt(filters.branch, 10));
      paramIdx++;
    }

    const sql = `
      SELECT 
        b.id as branch_id,
        b.branch_name,
        COALESCE((
          SELECT SUM(ii.quantity * ii.recorded_selling_price - ii.discount_amount)
          FROM invoices i
          JOIN invoice_items ii ON i.id = ii.invoice_id
          WHERE i.branch_id = b.id AND i.status != 'VOID'
          ${dateConditionI}
        ), 0) as total_sales,
        COALESCE((
          SELECT SUM(e.subtotal)
          FROM expenses e
          WHERE e.branch_id = b.id AND e.status = 'APPROVED'
          ${dateConditionE}
        ), 0) as total_expenses,
        COALESCE((
          SELECT SUM((im.quantity_deducted - im.quantity_added) * im.recorded_unit_cost)
          FROM inventory_movements im
          WHERE im.branch_id = b.id AND im.transaction_type IN ('MANUAL_ADJUSTMENT', 'SALES_INVOICE')
          ${dateConditionI.replace(/i\./g, "im.")}
        ), 0) as total_cogs
      FROM branches b
      WHERE b.is_active = TRUE
      ${branchCondition}
      ORDER BY total_sales DESC
    `;

    const result = await query(sql, values);
    return result.rows;
  }

  static async getRecentActivityFeed(branchFilter) {
    const values = [];
    let branchCondition = "";

    if (branchFilter && branchFilter !== "all") {
      branchCondition = `AND branch_id = $1::int`;
      values.push(parseInt(branchFilter, 10));
    }

    const sql = `
      SELECT 'INVOICE' as module, invoice_number as reference, created_at as activity_date, grand_total as amount, status::text, branch_id
      FROM invoices WHERE status != 'VOID' ${branchCondition}
      UNION ALL
      SELECT 'PAYMENT' as module, payment_number as reference, created_at as activity_date, amount_received as amount, payment_method::text as status, branch_id
      FROM payments WHERE status != 'VOID' ${branchCondition}
      UNION ALL
      SELECT 'BILL' as module, bill_number as reference, created_at as activity_date, grand_total as amount, status::text, branch_id
      FROM bills WHERE status != 'PENDING_RECEIPT' ${branchCondition}
      UNION ALL
      SELECT 'VENDOR_PAYMENT' as module, payment_number as reference, created_at as activity_date, amount_paid as amount, payment_method::text as status, branch_id
      FROM vendor_payments WHERE status != 'VOID' ${branchCondition}
      UNION ALL
      SELECT CASE WHEN scan_id IS NOT NULL THEN 'OCR_RECEIPT' ELSE 'EXPENSE' END as module, expense_number as reference, created_at as activity_date, total_amount as amount, status::text, branch_id
      FROM expenses WHERE status = 'APPROVED' ${branchCondition}
      ORDER BY activity_date DESC
      LIMIT 10
    `;

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = ManagerDashboard;
