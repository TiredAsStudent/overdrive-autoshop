const AuditLogService = require("../../services/sysadmin/audit.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class AuditLogController {
  // GET: /api/v1/sysadmin/audit
  static async getLogs(req, res) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        branchId: req.query.branchId,
        severity: req.query.severity,
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

      // Force browser to download as CSV file
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Overdrive_Audit_Report_${new Date().toISOString().split("T")[0]}.csv"`,
      );

      return res.status(STATUS_CODES.SUCCESS).send(csvData);
    } catch (error) {
      // If error (like no records found), return standard JSON error
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = AuditLogController;
