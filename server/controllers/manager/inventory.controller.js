const InventoryService = require("../../services/manager/inventory.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class InventoryController {
  static async getMarkup(req, res) {
    try {
      const markup = await InventoryService.getSystemMarkup();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        { markup_percentage: markup },
        "Markup fetched.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch markup.",
      );
    }
  }

  static async createItem(req, res) {
    try {
      if (req.body.sku) req.body.sku = req.body.sku.toUpperCase().trim();
      const item = await InventoryService.createInventoryItem(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(res, STATUS_CODES.CREATED, item, "Part added.");
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async updateItem(req, res) {
    try {
      const item = await InventoryService.updateInventoryItem(
        req.params.id,
        req.body,
        req.user.id,
        req.ip,
      );
      const actionMsg =
        req.body.is_active === false
          ? "Part archived."
          : req.body.is_active === true
            ? "Part restored."
            : "Part updated.";
      return sendSuccess(res, STATUS_CODES.SUCCESS, item, actionMsg);
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getOverview(req, res) {
    try {
      const branchId = req.query.branch_id
        ? parseInt(req.query.branch_id, 10)
        : null;
      const showArchived = req.query.archived === "true";

      const overview = await InventoryService.getStockOverview(
        branchId,
        showArchived,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        overview,
        "Stock retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve stock overview.",
      );
    }
  }
}

module.exports = InventoryController;
