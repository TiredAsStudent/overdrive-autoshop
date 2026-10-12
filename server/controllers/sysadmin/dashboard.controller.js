const DashboardService = require("../../services/sysadmin/dashboard.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class DashboardController {
  static async getOverview(req, res) {
    try {
      // Fetch the unified dashboard payload from the service
      const dashboardData = await DashboardService.getDashboardOverview();

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        dashboardData,
        "System dashboard overview retrieved successfully.",
      );
    } catch (error) {
      console.error("[DashboardController] getOverview Error:", error);
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to load dashboard overview data.",
        error.message,
      );
    }
  }
}

module.exports = DashboardController;
