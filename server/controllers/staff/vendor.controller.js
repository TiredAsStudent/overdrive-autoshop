const VendorModel = require("../../models/Vendor");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class StaffVendorController {
  static async getActiveLookup(req, res) {
    try {
      const activeVendors = await VendorModel.getActiveLookup();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        activeVendors,
        "Active vendors retrieved for operations.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch vendor list.",
        error.message,
      );
    }
  }
}

module.exports = StaffVendorController;
