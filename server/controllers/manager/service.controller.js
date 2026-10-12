const ServiceCatalogService = require("../../services/manager/service.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ServiceController {
  static async createService(req, res) {
    try {
      const service = await ServiceCatalogService.createService(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        service,
        "Master service created successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getServices(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || "";
      const category = req.query.category || "all";
      const status = req.query.status || "all";

      const result = await ServiceCatalogService.getServices(
        page,
        limit,
        search,
        category,
        status,
      );

      return res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        data: result.services,
        pagination: result.pagination,
        message: "Service catalog retrieved successfully.",
      });
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve service catalog.",
        error.message,
      );
    }
  }

  static async updateService(req, res) {
    try {
      const service = await ServiceCatalogService.updateService(
        req.params.id,
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        service,
        "Service profile updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async toggleServiceStatus(req, res) {
    try {
      const { is_active } = req.body;
      const service = await ServiceCatalogService.toggleServiceStatus(
        req.params.id,
        is_active,
        req.user.id,
        req.ip,
      );

      const statusMsg = is_active
        ? "activated and ready for billing"
        : "archived safely";
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        service,
        `Service successfully ${statusMsg}.`,
      );
    } catch (error) {
      const code =
        error.message === "Service not found."
          ? STATUS_CODES.NOT_FOUND
          : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async getServiceUsage(req, res) {
    try {
      const usageHistory = await ServiceCatalogService.getServiceUsage(
        req.params.id,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        usageHistory,
        "Service usage history retrieved successfully.",
      );
    } catch (error) {
      const code =
        error.message === "Service not found."
          ? STATUS_CODES.NOT_FOUND
          : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }
}

module.exports = ServiceController;
