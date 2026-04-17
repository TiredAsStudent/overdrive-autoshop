const SystemSettingsService = require("../../services/controlCenter/SystemSettingsService");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class SystemSettingsController {
  // GET: /api/v1/control-center/settings/financials
  static async getFinancials(req, res) {
    try {
      const data = await SystemSettingsService.getFinancials();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Financial settings retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  // PUT: /api/v1/control-center/settings/financials
  static async updateFinancials(req, res) {
    try {
      const { markupPercentage, vatPercentage } = req.body;
      const adminId = req.user.id; // From your auth middleware

      const data = await SystemSettingsService.updateFinancials(
        adminId,
        req.ip,
        markupPercentage,
        vatPercentage,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Financial rules successfully updated.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  // GET: /api/v1/control-center/settings/branches
  static async getBranches(req, res) {
    try {
      const data = await SystemSettingsService.getBranches();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Branches retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  // PUT: /api/v1/control-center/settings/branches/:id
  static async updateBranch(req, res) {
    try {
      const branchId = parseInt(req.params.id, 10);
      const { address, contactNumber } = req.body;
      const adminId = req.user.id;

      const data = await SystemSettingsService.updateBranch(
        adminId,
        req.ip,
        branchId,
        address,
        contactNumber,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Branch details updated.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = SystemSettingsController;
