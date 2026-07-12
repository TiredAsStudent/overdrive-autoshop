const InventoryService = require("../../services/manager/inventory.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class InventoryController {
  static async createMasterItem(req, res) {
    try {
      const item = await InventoryService.createMasterItem(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        item,
        "Master inventory item registered successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async updateMasterItem(req, res) {
    try {
      const item = await InventoryService.updateMasterItem(
        req.params.id,
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        item,
        "Master inventory item updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async toggleItemStatus(req, res) {
    try {
      const { is_active } = req.body;
      const item = await InventoryService.toggleItemStatus(
        req.params.id,
        is_active,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        item,
        `Inventory item successfully ${is_active ? "restored" : "archived"}.`,
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getInventoryCatalog(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || "";
      const category = req.query.category || "all";
      const branch = req.query.branch || "all";
      const status = req.query.status || "all";

      const result = await InventoryService.getInventoryCatalog(
        page,
        limit,
        search,
        category,
        branch,
        status,
      );

      return res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        message: "Company inventory catalog retrieved successfully.",
      });
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve inventory catalog.",
        error.message,
      );
    }
  }

  static async getBranchBreakdown(req, res) {
    try {
      const breakdown = await InventoryService.getItemBranchBreakdown(
        req.params.id,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        breakdown,
        "Branch-level stock extraction successful.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to extract branch stock data.",
        error.message,
      );
    }
  }

  static async getMovementHistory(req, res) {
    try {
      const history = await InventoryService.getItemMovementHistory(
        req.params.id,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        history,
        "Inventory movement history retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve movement history.",
        error.message,
      );
    }
  }
}

module.exports = InventoryController;
