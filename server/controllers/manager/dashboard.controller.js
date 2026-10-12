const ManagerDashboardService = require("../../services/manager/dashboard.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ManagerDashboardController {
  static async getOverview(req, res) {
    try {
      const filters = {
        branch: req.query.branch || "all",
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
      };

      const result = await ManagerDashboardService.getOverviewData(
        filters,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Executive Dashboard Overview compiled successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to compile Executive Dashboard Overview.",
        error.message,
      );
    }
  }
}

module.exports = ManagerDashboardController;
