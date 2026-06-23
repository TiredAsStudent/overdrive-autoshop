const HealthService = require("../../services/sysadmin/health.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class HealthController {
  static async getSystemHealth(req, res) {
    try {
      const metrics = await HealthService.getSystemMetrics();

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        metrics,
        "System health metrics processed successfully.",
      );
    } catch (error) {
      console.error("System Health Evaluation Failure:", error.message);
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to aggregate server environment analytics.",
        error.message,
      );
    }
  }
}

module.exports = HealthController;
