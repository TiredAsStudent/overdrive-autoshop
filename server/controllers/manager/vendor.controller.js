const ManagerVendorService = require("../../services/manager/vendor.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ManagerVendorController {
  static async registerVendor(req, res) {
    try {
      const vendor = await ManagerVendorService.registerVendor(
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        vendor,
        "Master vendor profile registered successfully.",
      );
    } catch (error) {
      const code = error.message.includes("already exists")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async getVendors(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      let { search, status, vat_status, branch } = req.query;

      const result = await ManagerVendorService.getVendors(
        page,
        limit,
        search,
        status,
        vat_status,
        branch,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Company vendor directory retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve vendors.",
        error.message,
      );
    }
  }

  static async updateVendor(req, res) {
    try {
      const vendor = await ManagerVendorService.updateVendor(
        req.params.id,
        req.body,
        req.user,
        req.ip,
      );
      const isStatusToggle = req.body.is_active !== undefined;
      const msg = isStatusToggle
        ? `Vendor successfully ${req.body.is_active ? "restored to active status" : "archived safely"}.`
        : "Vendor profile updated successfully.";

      return sendSuccess(res, STATUS_CODES.SUCCESS, vendor, msg);
    } catch (error) {
      const code = error.message.includes("Another supplier")
        ? STATUS_CODES.CONFLICT
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async getVendorLedger(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await ManagerVendorService.getVendorLedger(
        req.params.id,
        page,
        limit,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Vendor transaction ledger retrieved successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.NOT_FOUND, error.message);
    }
  }
}

module.exports = ManagerVendorController;
