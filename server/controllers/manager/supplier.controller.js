const Supplier = require("../../models/Supplier");
const SupplierService = require("../../services/manager/supplier.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class SupplierController {
  static async getActive(req, res) {
    try {
      const suppliers = await Supplier.getActive();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        suppliers,
        "Active suppliers retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to load suppliers.",
      );
    }
  }

  static async create(req, res) {
    try {
      const supplier = await SupplierService.createSupplier(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        supplier,
        "Supplier registered successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getLedger(req, res) {
    try {
      const showArchived = req.query.archived === "true";
      const ledger = await SupplierService.getLedger(showArchived);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        ledger,
        "Supplier ledger retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve ledger.",
      );
    }
  }

  static async getTimeline(req, res) {
    try {
      const data = await SupplierService.getSupplierTimeline(req.params.id);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Supplier timeline retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async update(req, res) {
    try {
      const supplier = await SupplierService.updateSupplier(
        req.params.id,
        req.body,
        req.user.id,
        req.ip,
      );
      const msg =
        req.body.is_active === false
          ? "Supplier archived."
          : "Supplier updated.";
      return sendSuccess(res, STATUS_CODES.SUCCESS, supplier, msg);
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = SupplierController;
