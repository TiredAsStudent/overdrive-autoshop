const MechanicService = require("../../services/manager/mechanic.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class MechanicController {
  static async createMechanic(req, res) {
    try {
      const mechanic = await MechanicService.enrollMechanic(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        mechanic,
        "Mechanic enrolled successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getMechanics(req, res) {
    try {
      const mechanics = await MechanicService.getAllMechanics();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        mechanics,
        "Mechanics registry retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve mechanics.",
      );
    }
  }

  static async updateMechanic(req, res) {
    try {
      const mechanic = await MechanicService.updateMechanic(
        req.params.id,
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        mechanic,
        "Mechanic profile updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = MechanicController;
