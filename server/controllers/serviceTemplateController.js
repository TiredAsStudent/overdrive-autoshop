const ServiceTemplateService = require("../services/serviceTemplateService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

class ServiceTemplateController {
  static async create(req, res) {
    try {
      const { templateName, laborCost, parts } = req.body;
      if (!templateName || laborCost === undefined) {
        return sendError(
          res,
          400,
          "Template Name and Labor Cost are required.",
        );
      }
      if (!Array.isArray(parts)) {
        return sendError(
          res,
          400,
          "Parts must be an array of inventory items.",
        );
      }

      const template = await ServiceTemplateService.createComboMeal(
        req.user.id,
        req.user.branchId,
        req.body,
        req.ip,
      );
      return sendSuccess(
        res,
        201,
        template,
        "Service Template created successfully.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  static async getAll(req, res) {
    try {
      const templates = await ServiceTemplateService.getTemplates(
        req.user.role,
      );
      return sendSuccess(
        res,
        200,
        templates,
        "Fetched templates successfully.",
      );
    } catch (error) {
      return sendError(res, 500, "Failed to fetch templates.");
    }
  }

  static async update(req, res) {
    try {
      const template = await ServiceTemplateService.updateComboMeal(
        req.user.id,
        req.user.branchId,
        req.params.id,
        req.body,
        req.ip,
      );
      return sendSuccess(
        res,
        200,
        template,
        "Service Template updated successfully.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  static async toggleStatus(req, res) {
    try {
      const { isActive } = req.body;
      const template = await ServiceTemplateService.toggleStatus(
        req.user.id,
        req.user.branchId,
        req.params.id,
        isActive,
        req.ip,
      );
      const msg = isActive ? "Template reactivated." : "Template deactivated.";
      return sendSuccess(res, 200, template, msg);
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }
}

module.exports = ServiceTemplateController;
