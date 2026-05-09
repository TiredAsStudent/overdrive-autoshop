const OcrService = require("../../services/staff/ocr.service");
const StaffExpenseService = require("../../services/staff/expense.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class StaffExpenseController {
  // Mode A: Receive image, run AI, return data for Split-Screen Review
  static async scanReceipt(req, res) {
    try {
      if (!req.file) {
        return sendError(
          res,
          STATUS_CODES.BAD_REQUEST,
          "No receipt image uploaded.",
        );
      }

      // The image is already saved to disk by multer
      const originalFilePath = req.file.path;
      const mimeType = req.file.mimetype;
      const imageUrl = `/uploads/receipts/${req.file.filename}`;

      // Run AI Extraction
      const extractedData = await OcrService.extractReceiptData(
        originalFilePath,
        mimeType,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        {
          image_url: imageUrl,
          extracted_data: extractedData,
        },
        "AI extraction complete. Ready for staff review.",
      );
    } catch (error) {
      // Return the image URL anyway so the frontend can immediately switch to Mode B (Manual)
      const imageUrl = req.file
        ? `/uploads/receipts/${req.file.filename}`
        : null;
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        {
          image_url: imageUrl,
          extracted_data: null,
          error_message: error.message,
        },
        "AI extraction failed. Switching to manual entry mode.",
      );
    }
  }

  // Mode A & B Final Submission
  static async submitExpense(req, res) {
    try {
      // Extract branch_id securely from the JWT token, NOT the frontend body
      const branchId = req.user.branchId;

      const result = await StaffExpenseService.submitPendingExpense(
        req.body,
        req.user.id,
        branchId,
        req.ip,
      );

      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        result,
        "Expense submitted to Manager for approval.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = StaffExpenseController;
