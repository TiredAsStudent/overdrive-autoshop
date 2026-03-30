const AnalyticsModel = require("../models/analyticsModel");

class AnalyticsService {
  static async getLeaderboard() {
    const leaderboardData = await AnalyticsModel.getBranchLeaderboard();

    // Formatting numbers
    return leaderboardData.map((branch) => ({
      branchId: branch.branch_id,
      branchName: branch.branch_name,
      totalRevenue: Number(branch.total_revenue),
      totalExpenses: Number(branch.total_expenses),
      netProfit: Number(branch.net_profit),
    }));
  }

  static async getDualBasisReport() {
    const ledger = await AnalyticsModel.getDualBasisLedger();

    // Structuring the data
    return {
      accrualBasis: {
        revenue: Number(ledger.accrual_revenue),
        expenses: Number(ledger.total_expenses),
        netProfit: Number(ledger.accrual_net_profit),
      },
      cashBasis: {
        revenue: Number(ledger.cash_revenue),
        expenses: Number(ledger.total_expenses),
        netProfit: Number(ledger.cash_net_profit),
      },
    };
  }
}

module.exports = AnalyticsService;
