const WorkshopServiceLogic = require("../../services/workshop.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ServiceController {
  static async createService(req, res) {
    try {
      const data = await WorkshopServiceLogic.createService(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        data,
        "Service package created successfully.",
      );
    } catch (error) {
      if (error.message.includes("already exists")) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
      }
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async getServices(req, res) {
    try {
      const onlyActive = req.user.role === "STAFF";
      const data =
        await WorkshopServiceLogic.getServicesWithDynamicPricing(onlyActive);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Services retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve services.",
        error.message,
      );
    }
  }

  static async updateService(req, res) {
    try {
      const { id } = req.params;
      const data = await WorkshopServiceLogic.updateService(
        id,
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Service package updated.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = ServiceController;
