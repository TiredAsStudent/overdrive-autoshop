const db = require("../config/db");

class AnalyticsModel {
  // The Performance Leaderboard (Grouped by Branch)
  static async getBranchLeaderboard(client = db) {
    const query = `
      SELECT 
        b.id AS branch_id,
        b.branch_name,
        COALESCE(rev.total_revenue, 0) AS total_revenue,
        COALESCE(exp.total_expenses, 0) AS total_expenses,
        (COALESCE(rev.total_revenue, 0) - COALESCE(exp.total_expenses, 0)) AS net_profit
      FROM branches b
      
      -- Join Revenue (Completed Estimates)
      LEFT JOIN (
        SELECT branch_id, SUM(grand_total) AS total_revenue 
        FROM estimates 
        WHERE status = 'COMPLETED' 
        GROUP BY branch_id
      ) rev ON b.id = rev.branch_id
      
      -- Join Expenses (Approved OCR Scans)
      LEFT JOIN (
        SELECT branch_id, SUM(total_amount) AS total_expenses 
        FROM expenses 
        WHERE status = 'APPROVED' 
        GROUP BY branch_id
      ) exp ON b.id = exp.branch_id
      
      ORDER BY net_profit DESC;
    `;
    const result = await client.query(query);
    return result.rows;
  }

  // The Dual-Basis Ledger (Company-Wide P&L)
  static async getDualBasisLedger(client = db) {
    const query = `
      WITH revenue_data AS (
        SELECT 
          -- Accrual Basis: ALL completed work, even if unpaid (Accounts Receivable)
          COALESCE(SUM(grand_total), 0) AS accrual_revenue,
          -- Cash Basis: ONLY work that has been physically paid for
          COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN grand_total ELSE 0 END), 0) AS cash_revenue
        FROM estimates
        WHERE status = 'COMPLETED'
      ),
      expense_data AS (
        SELECT 
          COALESCE(SUM(total_amount), 0) AS total_expenses
        FROM expenses
        WHERE status = 'APPROVED'
      )
      SELECT 
        r.accrual_revenue,
        r.cash_revenue,
        e.total_expenses,
        (r.accrual_revenue - e.total_expenses) AS accrual_net_profit,
        (r.cash_revenue - e.total_expenses) AS cash_net_profit
      FROM revenue_data r
      CROSS JOIN expense_data e;
    `;
    const result = await client.query(query);
    return result.rows[0]; // Returns a single object with the company-wide totals
  }
}

module.exports = AnalyticsModel;
