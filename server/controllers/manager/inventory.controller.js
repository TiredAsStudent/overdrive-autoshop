const InventoryService = require("../../services/manager/inventory.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class InventoryController {
  static async createItem(req, res) {
    try {
      if (req.body.sku) req.body.sku = req.body.sku.toUpperCase().trim();
      const item = await InventoryService.createInventoryItem(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        item,
        "Part successfully added to Master Inventory.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getOverview(req, res) {
    try {
      // Accepts an optional ?branch_id=1 query parameter from the frontend filter
      const branchId = req.query.branch_id
        ? parseInt(req.query.branch_id, 10)
        : null;
      const overview = await InventoryService.getStockOverview(branchId);

      const message = branchId
        ? "Branch stock overview retrieved."
        : "Consolidated company stock retrieved.";
      return sendSuccess(res, STATUS_CODES.SUCCESS, overview, message);
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve stock overview.",
      );
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
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        item,
        "Inventory item updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = InventoryController;
