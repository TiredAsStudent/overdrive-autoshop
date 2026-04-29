const OcrServiceLogic = require("../../services/ocr.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class OcrController {
  static async getQueue(req, res) {
    try {
      const data = await OcrServiceLogic.getPendingQueue();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Pending verifications retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch OCR queue.",
      );
    }
  }

  static async getDetails(req, res) {
    try {
      const data = await OcrServiceLogic.getScanDetails(req.params.id);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Scan details retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async approve(req, res) {
    try {
      const result = await OcrServiceLogic.approveScan(
        req.params.id,
        req.body,
        req.user.id,
        req.ip,
      );

      let msg =
        "Receipt successfully approved. Ledger, Balances, and Inventory updated.";
      if (result.inflationDetected) {
        msg += " INFLATION ALERT: Supplier pricing exceeded database records.";
      }

      return sendSuccess(res, STATUS_CODES.SUCCESS, result, msg);
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async reject(req, res) {
    try {
      const { reason } = req.body;
      await OcrServiceLogic.rejectScan(
        req.params.id,
        reason,
        req.user.id,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        null,
        "Receipt rejected. Note sent back to Maker.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = OcrController;
