const OcrServiceLogic = require("../../services/ocr.service"); // Updated import path
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

      let msg = "Receipt successfully approved. Ledger and Inventory updated.";
      // The Inflation Guard Trigger Message
      if (result.inflationDetected) {
        msg +=
          " INFLATION ALERT: Part costs have increased. Associated Combo Meals have been automatically adjusted.";
      }

      return sendSuccess(res, STATUS_CODES.SUCCESS, result, msg);
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async reject(req, res) {
    try {
      await OcrServiceLogic.rejectScan(req.params.id, req.user.id);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        null,
        "Receipt rejected. No ledger or inventory changes made.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = OcrController;
