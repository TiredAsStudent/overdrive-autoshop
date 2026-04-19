const WorkshopService = require("../../services/workshop.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class MechanicController {
  static async createMechanic(req, res) {
    try {
      const data = await WorkshopService.createMechanic(
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
      // req.branchId is set by your branchGuard middleware
      const data = await WorkshopService.getMechanics(req.branchId);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Mechanics retrieved successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve mechanics.",
        error.message,
      );
    }
  }

  static async updateMechanic(req, res) {
    try {
      const { id } = req.params;
      const data = await WorkshopService.updateMechanic(
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
