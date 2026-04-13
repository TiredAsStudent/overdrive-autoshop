const UserManagementService = require("../../services/controlCenter/userManagementService");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class UserManagementController {
  static async inviteUser(req, res) {
    try {
      // req.user and req.ip are populated by your middlewares
      const data = await UserManagementService.processNewInvite(
        req.user,
        req.body,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        data,
        "Invitation sent successfully. It will expire in 2 hours.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getRoster(req, res) {
    try {
      const roster = await UserManagementService.getLiveRoster();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        roster,
        "Live roster retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve user roster.",
      );
    }
  }

  static async updateUser(req, res) {
    try {
      const targetUserId = parseInt(req.params.id, 10);

      await UserManagementService.updateEmployeeProfile(
        req.user,
        targetUserId,
        req.body,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        null,
        "Employee profile updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async resendInvite(req, res) {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      const data = await UserManagementService.processResendInvite(
        req.user,
        targetUserId,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Invitation resent successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = UserManagementController;
