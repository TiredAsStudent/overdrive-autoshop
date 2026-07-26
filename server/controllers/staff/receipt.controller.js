const ReceiptService = require("../../services/staff/receipt.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class ReceiptController {
  static async uploadAndScan(req, res) {
    try {
      if (!req.file) {
        return sendError(
          res,
          STATUS_CODES.BAD_REQUEST,
          "No document uploaded or invalid file format.",
        );
      }

      const scanResult = await ReceiptService.processUpload(
        req.file,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        scanResult,
        "OCR processing completed. Ready for human verification.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Scan failed.",
        error.message,
      );
    }
  }

  static async getScanDetails(req, res) {
    try {
      const scan = await ReceiptService.getScanDetails(req.params.id, req.user);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        scan,
        "Scan data retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("Unauthorized")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.NOT_FOUND;
      return sendError(res, code, error.message);
    }
  }

  static async cancelScan(req, res) {
    try {
      const scan = await ReceiptService.cancelScan(
        req.params.id,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        scan,
        "Scan session discarded securely.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = ReceiptController;
