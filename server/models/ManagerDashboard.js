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
    const expFilters = this.buildFilterConditions(
      filters,
      "expense_date",
      "e.",
    );
    const jeFilters = this.buildFilterConditions(filters, "entry_date", "je.");
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

    // Parallel execution for fundamental KPI pillars
    const [
      salesRes,
      jeSalesRes,
      expenseRes,
      jeExpenseRes,
      cogsRes,
      arRes,
      apRes,
      stockRes,
    ] = await Promise.all([
      // 1. Total Net Sales (Invoices)
      query(
        `
        SELECT COALESCE(SUM(ii.quantity * ii.recorded_selling_price - ii.discount_amount), 0) as total
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        ${invFilters.whereClause ? invFilters.whereClause + " AND " : "WHERE "} i.status != 'VOID'
      `,
        invFilters.values,
      ),

      // 2. Adjusting Journal Entries (Income)
      query(
        `
        SELECT COALESCE(SUM(CASE WHEN ji.entry_type = 'CREDIT' THEN ji.amount ELSE -ji.amount END), 0) as total
        FROM journal_entries je
        JOIN journal_entry_items ji ON je.id = ji.journal_entry_id
        JOIN chart_of_accounts coa ON ji.account_id = coa.id
        ${jeFilters.whereClause ? jeFilters.whereClause + " AND " : "WHERE "} je.status = 'POSTED' AND coa.account_type = 'INCOME'
      `,
        jeFilters.values,
      ),

      // 3. Total Operating Expenses (Net of VAT)
      query(
        `
        SELECT COALESCE(SUM(e.subtotal), 0) as total
        FROM expenses e
        ${expFilters.whereClause ? expFilters.whereClause + " AND " : "WHERE "} e.status = 'APPROVED'
      `,
        expFilters.values,
      ),

      // 4. Adjusting Journal Entries (Expenses)
      query(
        `
        SELECT COALESCE(SUM(CASE WHEN ji.entry_type = 'DEBIT' THEN ji.amount ELSE -ji.amount END), 0) as total
        FROM journal_entries je
        JOIN journal_entry_items ji ON je.id = ji.journal_entry_id
        JOIN chart_of_accounts coa ON ji.account_id = coa.id
        ${jeFilters.whereClause ? jeFilters.whereClause + " AND " : "WHERE "} je.status = 'POSTED' AND coa.account_type = 'EXPENSE'
      `,
        jeFilters.values,
      ),

      // 5. Total Cost of Goods Sold (Shrinkage & Consumption linked to COA)
      query(
        `
        SELECT COALESCE(SUM((im.quantity_deducted - im.quantity_added) * im.recorded_unit_cost), 0) as total
        FROM inventory_movements im
        JOIN inventory_items i ON im.item_id = i.id
        JOIN chart_of_accounts coa ON i.expense_account_id = coa.id
        ${cogsFilters.whereClause ? cogsFilters.whereClause + " AND " : "WHERE "} im.transaction_type IN ('MANUAL_ADJUSTMENT', 'SALES_INVOICE') AND coa.account_type = 'EXPENSE'
      `,
        cogsFilters.values,
      ),

      // 6. Accounts Receivable (Outstanding balances)
      query(
        `
        SELECT COALESCE(SUM(grand_total - amount_paid), 0) as total
        FROM invoices i
        ${invFilters.whereClause ? invFilters.whereClause + " AND " : "WHERE "} i.status IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE')
      `,
        invFilters.values,
      ),

      // 7. Accounts Payable (Outstanding balances)
      query(
        `
        SELECT COALESCE(SUM(b.grand_total - b.amount_paid), 0) as total
        FROM bills b
        ${billFilters.whereClause ? billFilters.whereClause + " AND " : "WHERE "} b.status IN ('RECEIVED', 'CLOSED') AND b.payment_status IN ('UNPAID', 'PARTIALLY_PAID')
      `,
        billFilters.values,
      ),

      // 8. Total Inventory Asset Valuation
      query(
        `
        SELECT COALESCE(SUM(bi.quantity * i.unit_cost), 0) as total
        FROM branch_inventory bi
        JOIN inventory_items i ON bi.item_id = i.id
        ${stockFilters.whereClause}
      `,
        stockFilters.values,
      ),
    ]);

    return {
      total_sales:
        parseFloat(salesRes.rows[0].total) +
        parseFloat(jeSalesRes.rows[0].total),
      total_expenses:
        parseFloat(expenseRes.rows[0].total) +
        parseFloat(jeExpenseRes.rows[0].total),
      total_cogs: parseFloat(cogsRes.rows[0].total),
      total_ar: parseFloat(arRes.rows[0].total),
      total_ap: parseFloat(apRes.rows[0].total),
      total_inventory_value: parseFloat(stockRes.rows[0].total),
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
    let dateConditionJE = "";
    let dateConditionCogs = "";

    if (filters.start_date) {
      dateConditionI += ` AND i.created_at >= $${paramIdx}::timestamp`;
      dateConditionE += ` AND e.expense_date >= $${paramIdx}::timestamp`;
      dateConditionJE += ` AND je.entry_date >= $${paramIdx}::timestamp`;
      dateConditionCogs += ` AND im.created_at >= $${paramIdx}::timestamp`;
      values.push(`${filters.start_date} 00:00:00`);
      paramIdx++;
    }
    if (filters.end_date) {
      dateConditionI += ` AND i.created_at <= $${paramIdx}::timestamp`;
      dateConditionE += ` AND e.expense_date <= $${paramIdx}::timestamp`;
      dateConditionJE += ` AND je.entry_date <= $${paramIdx}::timestamp`;
      dateConditionCogs += ` AND im.created_at <= $${paramIdx}::timestamp`;
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
        ), 0) +
        COALESCE((
          SELECT SUM(CASE WHEN ji.entry_type = 'CREDIT' THEN ji.amount ELSE -ji.amount END)
          FROM journal_entries je
          JOIN journal_entry_items ji ON je.id = ji.journal_entry_id
          JOIN chart_of_accounts coa ON ji.account_id = coa.id
          WHERE je.branch_id = b.id AND je.status = 'POSTED' AND coa.account_type = 'INCOME'
          ${dateConditionJE}
        ), 0) as total_sales,
        
        COALESCE((
          SELECT SUM(e.subtotal)
          FROM expenses e
          WHERE e.branch_id = b.id AND e.status = 'APPROVED'
          ${dateConditionE}
        ), 0) +
        COALESCE((
          SELECT SUM(CASE WHEN ji.entry_type = 'DEBIT' THEN ji.amount ELSE -ji.amount END)
          FROM journal_entries je
          JOIN journal_entry_items ji ON je.id = ji.journal_entry_id
          JOIN chart_of_accounts coa ON ji.account_id = coa.id
          WHERE je.branch_id = b.id AND je.status = 'POSTED' AND coa.account_type = 'EXPENSE'
          ${dateConditionJE}
        ), 0) as total_expenses,

        COALESCE((
          SELECT SUM((im.quantity_deducted - im.quantity_added) * im.recorded_unit_cost)
          FROM inventory_movements im
          JOIN inventory_items inv ON im.item_id = inv.id
          JOIN chart_of_accounts coa ON inv.expense_account_id = coa.id
          WHERE im.branch_id = b.id AND im.transaction_type IN ('MANUAL_ADJUSTMENT', 'SALES_INVOICE') AND coa.account_type = 'EXPENSE'
          ${dateConditionCogs}
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
