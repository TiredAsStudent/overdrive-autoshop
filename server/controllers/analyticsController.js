const AnalyticsService = require("../services/analyticsService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

class AnalyticsController {
  static async getPerformanceLeaderboard(req, res) {
    try {
      const data = await AnalyticsService.getLeaderboard();
      return sendSuccess(
        res,
        200,
        data,
        "Branch performance leaderboard fetched successfully.",
      );
    } catch (error) {
      console.error("Analytics Error:", error);
      return sendError(res, 500, "Failed to generate performance leaderboard.");
    }
  }

  static async getDualBasisLedger(req, res) {
    try {
      const data = await AnalyticsService.getDualBasisReport();
      return sendSuccess(
        res,
        200,
        data,
        "Dual-Basis financial ledger generated successfully.",
      );
    } catch (error) {
      console.error("Analytics Error:", error);
      return sendError(res, 500, "Failed to generate financial ledger.");
    }
  }
}

module.exports = AnalyticsController;
