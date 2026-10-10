const StaffDashboardService = require("../../services/staff/dashboard.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class StaffDashboardController {
  static async getOverview(req, res) {
    try {
      // req.branchId is guaranteed to be injected and validated by the branchGuard middleware
      const branchId = req.branchId;
      const { start_date, end_date } = req.query;

      const dashboardData = await StaffDashboardService.getOverview(
        branchId,
        start_date,
        end_date,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        dashboardData,
        "Staff Dashboard metrics retrieved securely.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve dashboard overview.",
        error.message,
      );
    }
  }
}

module.exports = StaffDashboardController;
