const ServiceService = require("../../services/manager/service.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ServiceController {
  static async createService(req, res) {
    try {
      // Auto-uppercase the code before validation
      if (req.body.service_code) {
        req.body.service_code = req.body.service_code.toUpperCase().trim();
      }
      const service = await ServiceService.createService(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        service,
        "Service added to master catalog.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getServices(req, res) {
    try {
      const services = await ServiceService.getAllServices();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        services,
        "Service catalog retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve services.",
      );
    }
  }

  static async updateService(req, res) {
    try {
      const service = await ServiceService.updateService(
        req.params.id,
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        service,
        "Service details updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = ServiceController;
