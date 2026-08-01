const POApprovalService = require("../../services/manager/poApproval.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class POApprovalController {
  static async getPendingApprovals(req, res) {
    try {
      const branchId = req.query.branch || "all";
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { search, vendor } = req.query;

      const result = await POApprovalService.getPendingApprovals(
        page,
        limit,
        search,
        vendor,
        branchId,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Pending Purchase Orders retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch pending approvals.",
        error.message,
      );
    }
  }

  static async getApprovalHistory(req, res) {
    try {
      const branchId = req.query.branch || "all";
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { search, vendor } = req.query;

      const result = await POApprovalService.getApprovalHistory(
        page,
        limit,
        search,
        vendor,
        branchId,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Purchase Order approval history retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch approval history.",
        error.message,
      );
    }
  }

  static async getPODetails(req, res) {
    try {
      const po = await POApprovalService.getPODetails(req.params.id);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        po,
        "Purchase Order details retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("Unauthorized")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.NOT_FOUND;
      return sendError(res, code, error.message);
    }
  }

  static async approvePO(req, res) {
    try {
      const { remarks } = req.body;
      const po = await POApprovalService.approvePO(
        req.params.id,
        remarks,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        po,
        `Purchase Order ${po.purchase_order_number} has been officially approved.`,
      );
    } catch (error) {
      const code = error.message.includes("Conflict")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async rejectPO(req, res) {
    try {
      const { remarks } = req.body;
      const po = await POApprovalService.rejectPO(
        req.params.id,
        remarks,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        po,
        `Purchase Order ${po.purchase_order_number} has been rejected and closed.`,
      );
    } catch (error) {
      const code = error.message.includes("Conflict")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }
}

module.exports = POApprovalController;
