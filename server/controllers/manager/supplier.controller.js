const Supplier = require("../../models/Supplier");
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
        error.message,
      );
    }
  }
}

module.exports = SupplierController;
