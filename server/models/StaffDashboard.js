const { query } = require("../config/db");

class StaffDashboard {
  static async getOperationalKPIs(branchId, startDate, endDate) {
    const values = [branchId];
    let paramIdx = 2;

    let dateConditionI = ""; // Invoices
    let dateConditionP = ""; // Payments
    let dateConditionE = ""; // Expenses
    let dateConditionB = ""; // Bills

    if (startDate) {
      dateConditionI += ` AND created_at >= $${paramIdx}::timestamp`;
      dateConditionP += ` AND payment_date >= $${paramIdx}::date`;
      dateConditionE += ` AND expense_date >= $${paramIdx}::date`;
      dateConditionB += ` AND bill_date >= $${paramIdx}::date`;
      values.push(`${startDate} 00:00:00`);
      paramIdx++;
    }

    if (endDate) {
      dateConditionI += ` AND created_at <= $${paramIdx}::timestamp`;
      dateConditionP += ` AND payment_date <= $${paramIdx}::date`;
      dateConditionE += ` AND expense_date <= $${paramIdx}::date`;
      dateConditionB += ` AND bill_date <= $${paramIdx}::date`;
      values.push(`${endDate} 23:59:59.999`);
      paramIdx++;
    }

    const sql = `
      SELECT 
        COALESCE((
          SELECT SUM(grand_total) FROM invoices 
          WHERE branch_id = $1 AND status != 'VOID' ${dateConditionI}
        ), 0) as total_sales,
        
        COALESCE((
          SELECT SUM(amount_received) FROM payments 
          WHERE branch_id = $1 AND status != 'VOID' ${dateConditionP}
        ), 0) as total_collections,
        
        COALESCE((
          SELECT SUM(total_amount) FROM expenses 
          WHERE branch_id = $1 AND status = 'APPROVED' ${dateConditionE}
        ), 0) as total_expenses,
        
        COALESCE((
          SELECT SUM(grand_total) FROM bills 
          WHERE branch_id = $1 AND status IN ('RECEIVED', 'CLOSED') ${dateConditionB}
        ), 0) as total_procurement
    `;

    const result = await query(sql, values);
    return {
      total_sales: parseFloat(result.rows[0].total_sales),
      total_collections: parseFloat(result.rows[0].total_collections),
      total_expenses: parseFloat(result.rows[0].total_expenses),
      total_procurement: parseFloat(result.rows[0].total_procurement),
    };
  }

  static async getActionAlerts(branchId) {
    const sql = `
      SELECT 
        (SELECT COUNT(id) FROM estimates WHERE status = 'APPROVED' AND branch_id = $1) as pending_estimates,
        (SELECT COUNT(id) FROM sales_orders WHERE status = 'COMPLETED' AND branch_id = $1) as pending_billings,
        (SELECT COUNT(id) FROM invoices WHERE status IN ('UNPAID', 'PARTIALLY_PAID') AND due_date < CURRENT_DATE AND branch_id = $1) as overdue_invoices,
        (SELECT COUNT(po.id) FROM purchase_orders po LEFT JOIN bills b ON po.id = b.purchase_order_id WHERE po.status = 'APPROVED' AND b.id IS NULL AND po.branch_id = $1) as pending_deliveries,
        (SELECT COUNT(id) FROM receipt_scans WHERE status = 'PENDING_VERIFICATION' AND branch_id = $1) as unverified_receipts,
        (SELECT COUNT(id) FROM stock_adjustment_requests WHERE status = 'PENDING' AND branch_id = $1) as pending_adjustments
    `;
    const result = await query(sql, [branchId]);

    return {
      pending_estimates: parseInt(result.rows[0].pending_estimates, 10),
      pending_billings: parseInt(result.rows[0].pending_billings, 10),
      overdue_invoices: parseInt(result.rows[0].overdue_invoices, 10),
      pending_deliveries: parseInt(result.rows[0].pending_deliveries, 10),
      unverified_receipts: parseInt(result.rows[0].unverified_receipts, 10),
      pending_adjustments: parseInt(result.rows[0].pending_adjustments, 10),
    };
  }

  static async getInventoryAlerts(branchId) {
    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN bi.quantity = 0 THEN 1 ELSE 0 END), 0) as out_of_stock_count,
        COALESCE(SUM(CASE WHEN bi.quantity > 0 AND bi.quantity <= COALESCE(bi.reorder_point, i.default_reorder_level) THEN 1 ELSE 0 END), 0) as low_stock_count
      FROM branch_inventory bi
      JOIN inventory_items i ON bi.item_id = i.id
      WHERE bi.branch_id = $1 AND i.is_active = TRUE
    `;
    const result = await query(sql, [branchId]);

    return {
      out_of_stock_count: parseInt(result.rows[0].out_of_stock_count, 10),
      low_stock_count: parseInt(result.rows[0].low_stock_count, 10),
    };
  }

  static async getRecentActivityFeed(branchId, startDate, endDate) {
    const values = [branchId];
    let paramIdx = 2;
    let dateCondition = "";

    if (startDate && endDate) {
      dateCondition = `AND created_at BETWEEN $${paramIdx}::timestamp AND $${paramIdx + 1}::timestamp`;
      values.push(`${startDate} 00:00:00`, `${endDate} 23:59:59.999`);
      paramIdx += 2;
    }

    const sql = `
      SELECT 'INVOICE' as module, invoice_number as reference, created_at as activity_date, grand_total as amount, status::text
      FROM invoices WHERE branch_id = $1 AND status != 'VOID' ${dateCondition}
      
      UNION ALL
      
      SELECT 'PAYMENT' as module, payment_number as reference, created_at as activity_date, amount_received as amount, payment_method::text as status
      FROM payments WHERE branch_id = $1 AND status != 'VOID' ${dateCondition}
      
      UNION ALL
      
      SELECT 'BILL' as module, bill_number as reference, created_at as activity_date, grand_total as amount, status::text
      FROM bills WHERE branch_id = $1 AND status != 'PENDING_RECEIPT' ${dateCondition}
      
      UNION ALL
      
      SELECT CASE WHEN scan_id IS NOT NULL THEN 'OCR_RECEIPT' ELSE 'EXPENSE' END as module, expense_number as reference, created_at as activity_date, total_amount as amount, status::text
      FROM expenses WHERE branch_id = $1 AND status IN ('APPROVED', 'PENDING_APPROVAL') ${dateCondition}
      
      ORDER BY activity_date DESC
      LIMIT 10
    `;

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = StaffDashboard;
