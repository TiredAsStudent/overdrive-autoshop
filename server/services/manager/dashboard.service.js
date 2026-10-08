const ManagerDashboardModel = require("../../models/ManagerDashboard");
const { logSecureAction } = require("../../utils/auditLogger");

class ManagerDashboardService {
  static async getOverviewData(filters, activeUser, ipAddress) {
    const targetBranch =
      filters.branch === "all" ? null : parseInt(filters.branch, 10);

    // 1. Parallel execution of high-performance aggregation queries
    const [kpis, alerts, branchPerformance, recentActivities] =
      await Promise.all([
        ManagerDashboardModel.getExecutiveKPIs(filters),
        ManagerDashboardModel.getActionAlerts(filters.branch),
        ManagerDashboardModel.getBranchPerformanceDistribution(filters),
        ManagerDashboardModel.getRecentActivityFeed(filters.branch),
      ]);

    // 2. Mathematical Margin Computations
    const netOperatingMargin = kpis.total_sales - kpis.total_expenses;

    // 3. Construct Payload
    const reportData = {
      kpis: {
        total_sales: kpis.total_sales,
        total_expenses: kpis.total_expenses,
        net_operating_margin: netOperatingMargin,
        total_ar: kpis.total_ar,
        total_ap: kpis.total_ap,
        total_inventory_value: kpis.total_inventory_value,
      },
      alerts: {
        approvals: {
          pending_pos: parseInt(alerts.pending_pos, 10),
          pending_manual_expenses: parseInt(alerts.pending_manual_expenses, 10),
          pending_ocr_receipts: parseInt(alerts.pending_ocr_receipts, 10),
          pending_stock_adjustments: parseInt(
            alerts.pending_stock_adjustments,
            10,
          ),
        },
        inventory: {
          out_of_stock_count: parseInt(alerts.out_of_stock_count, 10),
          low_stock_count: parseInt(alerts.low_stock_count, 10),
        },
        financial: {
          overdue_invoices: parseInt(alerts.overdue_invoices, 10),
          overdue_bills: parseInt(alerts.overdue_bills, 10),
        },
      },
      distributions: {
        branch_performance: branchPerformance.map((b) => ({
          branch_id: b.branch_id,
          branch_name: b.branch_name,
          total_sales: parseFloat(b.total_sales),
          total_expenses: parseFloat(b.total_expenses),
          net_margin: parseFloat(b.total_sales) - parseFloat(b.total_expenses),
        })),
      },
      recent_activities: recentActivities.map((r) => ({
        module: r.module,
        reference: r.reference,
        activity_date: r.activity_date,
        amount: parseFloat(r.amount),
        status: r.status,
        branch_id: r.branch_id,
      })),
    };

    // 4. Immutable Security Logging
    await logSecureAction(
      activeUser.id,
      targetBranch,
      "VIEW_MANAGER_DASHBOARD",
      "INFO",
      ipAddress,
      "system_settings",
      null,
      null,
      { filters },
    );

    return reportData;
  }
}

module.exports = ManagerDashboardService;
