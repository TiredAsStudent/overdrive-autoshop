const InventoryLogic = require("../../services/inventory.service"); // Updated import path
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class InventoryController {
  static async getInventory(req, res) {
    try {
      const data = await InventoryLogic.getAllItems();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Inventory retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async createInventoryItem(req, res) {
    try {
      const data = await InventoryLogic.createItem(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        data,
        "Item added to Master Inventory.",
      );
    } catch (error) {
      if (error.message.includes("already exists")) {
        return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
      }
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async updateInventoryItem(req, res) {
    try {
      const data = await InventoryLogic.updateItem(
        req.params.id,
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Inventory item updated.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = InventoryController;
