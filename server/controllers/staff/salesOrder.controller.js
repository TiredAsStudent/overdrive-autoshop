const SalesOrderService = require("../../services/staff/salesOrder.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class SalesOrderController {
  static async createSalesOrder(req, res) {
    try {
      const so = await SalesOrderService.createSalesOrder(
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        so,
        "Estimate successfully converted to Sales Order.",
      );
    } catch (error) {
      const code = error.message.includes("already been converted")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async getSalesOrders(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { search, status, branch } = req.query;

      const result = await SalesOrderService.getSalesOrders(
        page,
        limit,
        search,
        status,
        branch,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Sales Orders retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch sales orders.",
        error.message,
      );
    }
  }

  static async getSalesOrderDetails(req, res) {
    try {
      const so = await SalesOrderService.getSalesOrderDetails(
        req.params.id,
        req.user,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        so,
        "Sales Order details retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("Unauthorized")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.NOT_FOUND;
      return sendError(res, code, error.message);
    }
  }

  static async updateSalesOrder(req, res) {
    try {
      const so = await SalesOrderService.updateSalesOrder(
        req.params.id,
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        so,
        "Sales Order updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = SalesOrderController;
