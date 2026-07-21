const BillService = require("../../services/staff/bill.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class BillController {
  static async createBill(req, res) {
    try {
      const bill = await BillService.createBill(req.body, req.user, req.ip);
      const msg =
        bill.status === "RECEIVED"
          ? "Bill successfully posted and inventory updated."
          : "Bill drafted successfully.";
      return sendSuccess(res, STATUS_CODES.CREATED, bill, msg);
    } catch (error) {
      const code = error.message.includes("already been billed")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async confirmReceipt(req, res) {
    try {
      const bill = await BillService.confirmReceipt(
        req.params.id,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        bill,
        "Goods confirmed as received. Financials posted and Inventory incremented.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getBills(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      let { search, status, vendor, branch } = req.query;

      if (req.user.role === "STAFF") branch = req.user.branchId;

      const result = await BillService.getBills(
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
        "Supplier Bills retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch bills.",
        error.message,
      );
    }
  }

  static async getBillDetails(req, res) {
    try {
      const bill = await BillService.getBillDetails(req.params.id, req.user);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        bill,
        "Bill details retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("Unauthorized")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.NOT_FOUND;
      return sendError(res, code, error.message);
    }
  }
}

module.exports = BillController;
