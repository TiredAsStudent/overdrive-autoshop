const CustomerService = require("../../services/staff/customer.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class CustomerController {
  static async registerCustomer(req, res) {
    try {
      const customer = await CustomerService.registerCustomer(
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        customer,
        "Customer registered successfully.",
      );
    } catch (error) {
      const code = error.message.includes("already exists")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async getCustomers(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || "";
      const status = req.query.status || "all";

      let branch = req.query.branch || "all";
      if (req.user.role === "STAFF") {
        branch = req.user.branchId;
      }

      const result = await CustomerService.getCustomers(
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
        "Customer directory retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve customers.",
        error.message,
      );
    }
  }

  static async updateCustomer(req, res) {
    try {
      const customer = await CustomerService.updateCustomer(
        req.params.id,
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        customer,
        "Customer profile updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getCustomerProfile(req, res) {
    try {
      const data = await CustomerService.getCustomerProfile(req.params.id);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Customer profile retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("not found")
        ? STATUS_CODES.NOT_FOUND
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }
}

module.exports = CustomerController;
