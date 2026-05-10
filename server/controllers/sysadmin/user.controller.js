const UserService = require("../../services/sysadmin/user.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class UserController {
  static async inviteUser(req, res) {
    try {
      const data = await UserService.processNewInvite(
        req.user,
        req.body,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        data,
        "Invitation sent successfully. Expires in 2 hours.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getRoster(req, res) {
    try {
      const roster = await UserService.getLiveRoster();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        roster,
        "Live enterprise roster retrieved.",
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
      await UserService.updateEmployeeProfile(
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

  static async killSession(req, res) {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      const data = await UserService.executeKillSwitch(
        req.user,
        targetUserId,
        req.ip,
      );
      return sendSuccess(res, STATUS_CODES.SUCCESS, null, data.message);
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async resendInvite(req, res) {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      const data = await UserService.processResendInvite(
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

module.exports = UserController;
