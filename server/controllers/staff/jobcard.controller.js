const JobCardService = require("../../services/jobcard.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class JobCardController {
  static async getBoard(req, res) {
    try {
      const data = await JobCardService.getBranchBoard(req.user.branchId);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Kanban board retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async updateStatus(req, res) {
    try {
      const data = await JobCardService.updateJobStatus(
        req.params.id,
        req.body.status,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        `Job moved to ${req.body.status}`,
      );
    } catch (error) {
      const code = error.message.includes("Security")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async assignMechanic(req, res) {
    try {
      const data = await JobCardService.assignMechanic(
        req.params.id,
        req.body.mechanic_id,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Mechanic assigned successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async updateDiagnosis(req, res) {
    try {
      const data = await JobCardService.updateDiagnosis(
        req.params.id,
        req.body.diagnostic_notes,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Diagnostic notes updated.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = JobCardController;
