const VatService = require("../../services/manager/vat.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class VatController {
  static async getDashboard(req, res) {
    try {
      const { tax_period, branch_id } = req.query;
      const data = await VatService.getVatDashboard(tax_period, branch_id);

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "VAT Ledger retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async closePeriod(req, res) {
    try {
      const { tax_period } = req.body;
      const result = await VatService.closeTaxPeriod(
        tax_period,
        req.user.id,
        req.ip,
      );

      return sendSuccess(res, STATUS_CODES.SUCCESS, result, result.message);
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = VatController;
