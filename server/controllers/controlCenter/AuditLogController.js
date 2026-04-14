const AuditLogService = require("../../services/controlCenter/AuditLogService");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class AuditLogController {
  // GET: /api/v1/control-center/logs
  static async getLogs(req, res) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        branchId: req.query.branchId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const data = await AuditLogService.fetchPaginatedLogs(filters);

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Activity logs securely retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve activity logs.",
        error.message,
      );
    }
  }
}

module.exports = AuditLogController;
