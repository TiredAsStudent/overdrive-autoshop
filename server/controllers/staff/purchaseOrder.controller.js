const PurchaseOrderService = require("../../services/staff/purchaseOrder.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class PurchaseOrderController {
  static async createPurchaseOrder(req, res) {
    try {
      const po = await PurchaseOrderService.createPurchaseOrder(
        req.body,
        req.user,
        req.ip,
      );
      const msg = req.body.is_submitting
        ? "Purchase Order generated and submitted for managerial approval."
        : "Purchase Order drafted successfully.";
      return sendSuccess(res, STATUS_CODES.CREATED, po, msg);
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getPurchaseOrders(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      let { search, status, vendor, branch } = req.query;

      if (req.user.role === "STAFF") {
        branch = req.user.branchId;
      }

      const result = await PurchaseOrderService.getPurchaseOrders(
        page,
        limit,
        search,
        status,
        vendor,
        branch,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Purchase Orders retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch PO list.",
        error.message,
      );
    }
  }

  static async getPurchaseOrderDetails(req, res) {
    try {
      const po = await PurchaseOrderService.getPurchaseOrderDetails(
        req.params.id,
        req.user,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        po,
        "Purchase Order retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("Unauthorized")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.NOT_FOUND;
      return sendError(res, code, error.message);
    }
  }

  static async updatePurchaseOrder(req, res) {
    try {
      const po = await PurchaseOrderService.updatePurchaseOrder(
        req.params.id,
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        po,
        "Purchase Order modified successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async updateStatus(req, res) {
    try {
      const po = await PurchaseOrderService.updateStatus(
        req.params.id,
        req.body.status,
        req.user,
        req.ip,
      );
      const actionMsg =
        req.body.status === "PENDING_APPROVAL"
          ? "submitted for approval"
          : "cancelled";
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        po,
        `Purchase Order successfully ${actionMsg}.`,
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getEligibleForBilling(req, res) {
    try {
      const branchId =
        req.user.role === "STAFF"
          ? req.user.branchId
          : req.query.branch || req.user.branchId;

      const pos = await PurchaseOrderService.getEligibleForBilling(branchId);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        pos,
        "Eligible Purchase Orders retrieved for billing.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch eligible POs.",
        error.message,
      );
    }
  }
}

module.exports = PurchaseOrderController;
