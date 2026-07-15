const InvoiceService = require("../../services/staff/invoice.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class InvoiceController {
  static async createInvoice(req, res) {
    try {
      const invoice = await InvoiceService.createInvoice(
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        invoice,
        "Official Invoice generated successfully.",
      );
    } catch (error) {
      const code = error.message.includes("already been billed")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async getInvoices(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { search, status, branch } = req.query;

      const result = await InvoiceService.getInvoices(
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
        "Invoices retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch invoices.",
        error.message,
      );
    }
  }

  static async getInvoiceDetails(req, res) {
    try {
      const invoice = await InvoiceService.getInvoiceDetails(
        req.params.id,
        req.user,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        invoice,
        "Invoice details retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("Unauthorized")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.NOT_FOUND;
      return sendError(res, code, error.message);
    }
  }

  static async updateInvoice(req, res) {
    try {
      const invoice = await InvoiceService.updateInvoice(
        req.params.id,
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        invoice,
        "Invoice updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = InvoiceController;
