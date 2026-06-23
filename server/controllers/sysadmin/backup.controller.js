const BackupService = require("../../services/sysadmin/backup.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class BackupController {
  static async triggerBackup(req, res) {
    try {
      const backup = await BackupService.generateBackup(
        req.user.id,
        req.ip,
        true, // isManual = true
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        backup,
        "System database backup successfully compiled and stored.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async getBackups(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 5;
      const search = req.query.search || "";

      const result = await BackupService.getBackupLogs(page, limit, search);

      return res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
        message: "Backup logs retrieved successfully.",
      });
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve backup logs.",
      );
    }
  }
}

module.exports = BackupController;
