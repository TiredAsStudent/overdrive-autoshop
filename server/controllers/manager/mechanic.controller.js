const MechanicService = require("../../services/workshop.service"); // Updated import path
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class MechanicController {
  static async createMechanic(req, res) {
    try {
      const data = await MechanicService.createMechanic(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        data,
        "Mechanic profile created successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async getMechanics(req, res) {
    try {
      // req.branchId is automatically securely set by your branchGuard middleware
      const data = await MechanicService.getMechanics(req.branchId);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Mechanics retrieved.",
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
      const { id } = req.params;
      const data = await MechanicService.updateMechanic(
        id,
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Mechanic profile updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = MechanicController;
