const AuditLogService = require("../../services/sysadmin/audit.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class AuditLogController {
  static async getSeverities(req, res) {
    try {
      const severities = await AuditLogService.getSeverities();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        severities,
        "Dynamic severities retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve severities.",
        error.message,
      );
    }
  }

  // GET: /api/v1/sysadmin/audit
  static async getLogs(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 15;
      const search = req.query.search || "";
      const branchId = req.query.branchId || "";
      const severity = req.query.severity || "";
      const startDate = req.query.startDate || "";
      const endDate = req.query.endDate || "";

      const result = await AuditLogService.fetchPaginatedLogs(
        page,
        limit,
        search,
        branchId,
        severity,
        startDate,
        endDate,
      );

      return res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
        message: "Activity logs securely retrieved.",
      });
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve activity logs.",
        error.message,
      );
    }
  }

  // GET: /api/v1/sysadmin/audit/export
  static async exportLogs(req, res) {
    try {
      const filters = {
        search: req.query.search,
        branchId: req.query.branchId,
        severity: req.query.severity,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const csvData = await AuditLogService.generateCSVExport(filters);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Overdrive_Audit_Report_${new Date().toISOString().split("T")[0]}.csv"`,
      );

      return res.status(STATUS_CODES.SUCCESS).send(csvData);
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = AuditLogController;
