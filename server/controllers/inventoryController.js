const InventoryService = require("../services/inventoryService");
const InventoryModel = require("../models/inventoryModel");
const { sendSuccess, sendError } = require("../utils/responseHandler");

class InventoryController {
  // --- MASTER INVENTORY ---
  static async createMasterPart(req, res) {
    try {
      const { partName, unitCost, retailPrice } = req.body;
      if (!partName || unitCost === undefined || retailPrice === undefined) {
        return sendError(
          res,
          400,
          "Part Name, Unit Cost, and Retail Price are required.",
        );
      }
      const part = await InventoryService.addMasterPart(
        req.user.id,
        req.user.branchId,
        req.body,
        req.ip,
      );
      return sendSuccess(res, 201, part, "Master part cataloged successfully.");
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  static async getCatalog(req, res) {
    try {
      const onlyActive = req.user.role === "STAFF";
      const parts = await InventoryModel.getAllMasterParts(onlyActive);
      return sendSuccess(
        res,
        200,
        parts,
        "Fetched master inventory successfully.",
      );
    } catch (error) {
      return sendError(res, 500, "Failed to fetch inventory.");
    }
  }

  static async updateMasterPart(req, res) {
    try {
      const { partName, unitCost, retailPrice } = req.body;
      if (!partName || unitCost === undefined || retailPrice === undefined) {
        return sendError(
          res,
          400,
          "Part Name, Unit Cost, and Retail Price are required.",
        );
      }
      const part = await InventoryService.editMasterPart(
        req.user.id,
        req.user.branchId,
        req.params.id,
        req.body,
        req.ip,
      );
      return sendSuccess(res, 200, part, "Master part updated successfully.");
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  static async toggleStatus(req, res) {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== "boolean")
        return sendError(res, 400, "isActive must be a boolean value.");

      const part = await InventoryService.toggleMasterPartStatus(
        req.user.id,
        req.user.branchId,
        req.params.id,
        isActive,
        req.ip,
      );
      const msg = isActive
        ? "Master part reactivated."
        : "Master part deactivated.";
      return sendSuccess(res, 200, part, msg);
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  // --- LOCAL STOCK API ---
  static async getLocalStock(req, res) {
    try {
      let branchToQuery = req.user.branchId;
      if (req.user.role === "ADMIN" && req.query.branchId) {
        branchToQuery = req.query.branchId;
      }
      const stock = await InventoryModel.getLocalStockByBranch(branchToQuery);
      return sendSuccess(res, 200, stock, "Fetched local stock successfully.");
    } catch (error) {
      return sendError(res, 500, "Failed to fetch local stock.");
    }
  }

  // --- STOCK TRANSFER HUB ---
  static async transferStock(req, res) {
    try {
      const { fromBranchId, toBranchId, masterPartId, quantity } = req.body;
      if (!fromBranchId || !toBranchId || !masterPartId || !quantity) {
        return sendError(
          res,
          400,
          "Missing required fields for stock transfer.",
        );
      }
      const result = await InventoryService.executeTransfer(
        req.user.id,
        req.user.branchId,
        req.body,
        req.ip,
      );
      return sendSuccess(res, 200, result, result.message);
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  // --- INVENTORY SECURITY ---
  static async requestAdjustment(req, res) {
    try {
      const { masterPartId, quantityChange, reason } = req.body;
      if (!masterPartId || !quantityChange || !reason) {
        return sendError(
          res,
          400,
          "Part ID, Quantity Change, and Reason are required.",
        );
      }
      const request = await InventoryService.submitAdjustmentRequest(
        req.user.id,
        req.user.branchId,
        req.body,
        req.ip,
      );
      return sendSuccess(
        res,
        201,
        request,
        "Adjustment request submitted to Admin for review.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  static async resolveAdjustment(req, res) {
    try {
      const { isApproved } = req.body;
      if (typeof isApproved !== "boolean")
        return sendError(res, 400, "isApproved must be a boolean value.");

      const adjustment = await InventoryService.resolveAdjustment(
        req.user.id,
        req.user.branchId,
        req.params.id,
        isApproved,
        req.ip,
      );
      const msg = isApproved
        ? "Adjustment approved and stock updated."
        : "Adjustment rejected.";
      return sendSuccess(res, 200, adjustment, msg);
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  // --- TRANSFER REQUESTS (STAFF TASKS) ---
  static async requestInterBranchTransfer(req, res) {
    try {
      const { fromBranchId, masterPartId, quantity } = req.body;
      if (!fromBranchId || !masterPartId || !quantity) {
        return sendError(
          res,
          400,
          "Source Branch, Part ID, and Quantity are required.",
        );
      }
      const request = await InventoryService.submitTransferRequest(
        req.user.id,
        req.user.branchId,
        req.body,
        req.ip,
      );
      return sendSuccess(
        res,
        201,
        request,
        "Transfer request submitted to Admin.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  static async resolveTransferRequest(req, res) {
    try {
      const { isApproved } = req.body;
      if (typeof isApproved !== "boolean")
        return sendError(res, 400, "isApproved must be a boolean.");

      const request = await InventoryService.resolveTransferRequest(
        req.user.id,
        req.user.branchId,
        req.params.id,
        isApproved,
        req.ip,
      );
      const msg = isApproved
        ? "Transfer approved and inventory moved."
        : "Transfer request rejected.";
      return sendSuccess(res, 200, request, msg);
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }
}

module.exports = InventoryController;
