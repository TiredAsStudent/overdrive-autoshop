const SystemSetting = require("../../models/SystemSetting");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class StaffSettingsController {
  static async getVatRate(req, res) {
    try {
      const settings = await SystemSetting.getSettings();
      // Securely return ONLY the VAT percentage to the staff
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        { vat_percentage: settings.vat_percentage },
        "Global VAT rate retrieved successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve VAT settings.",
      );
    }
  }
}

module.exports = StaffSettingsController;
