const StaffDashboardModel = require("../../models/StaffDashboard");

class StaffDashboardService {
  static async getOverview(branchId, startDate, endDate) {
    if (!branchId) {
      throw new Error(
        "System Error: Branch context is strictly required to view dashboard data.",
      );
    }

    // Execute queries in parallel for high performance
    const [kpis, actionAlerts, inventoryAlerts, recentActivity] =
      await Promise.all([
        StaffDashboardModel.getOperationalKPIs(branchId, startDate, endDate),
        StaffDashboardModel.getActionAlerts(branchId),
        StaffDashboardModel.getInventoryAlerts(branchId),
        StaffDashboardModel.getRecentActivityFeed(branchId, startDate, endDate),
      ]);

    return {
      kpis,
      action_alerts: actionAlerts,
      inventory_alerts: inventoryAlerts,
      recent_activity: recentActivity,
    };
  }
}

module.exports = StaffDashboardService;
