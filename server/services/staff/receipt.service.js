const fs = require("fs").promises;
const path = require("path");
const ReceiptScanModel = require("../../models/ReceiptScan");
const OCRService = require("../ocr.service");
const { logSecureAction } = require("../../utils/auditLogger");

class ReceiptService {
  static async processUpload(file, activeUser, ipAddress) {
    if (!file) throw new Error("No receipt file provided.");

    const scanData = {
      branch_id: activeUser.branchId,
      uploaded_by: activeUser.id,
      original_filename: file.originalname,
      file_path: `/uploads/receipts/${file.filename}`,
      file_size: file.size,
      mime_type: file.mimetype,
      status: "PROCESSING",
    };

    const initialScan = await ReceiptScanModel.create(scanData);

    try {
      const ocrResult = await OCRService.processDocument(
        file.path,
        file.mimetype,
      );

      const completedScan = await ReceiptScanModel.updateExtraction(
        initialScan.id,
        ocrResult.extracted_data,
        ocrResult.confidence_score,
        ocrResult.raw_ocr_text,
      );

      await logSecureAction(
        activeUser.id,
        activeUser.branchId,
        "OCR_SCAN_COMPLETED",
        "INFO",
        ipAddress,
        "receipt_scans",
        completedScan.id,
        null,
        {
          confidence: completedScan.confidence_score,
          file: completedScan.original_filename,
        },
      );

      return completedScan;
    } catch (error) {
      await ReceiptScanModel.updateStatus(initialScan.id, "DISCARDED");

      try {
        const cleanPath = scanData.file_path.replace(/^\//, "");
        const absolutePath = path.join(__dirname, "../../", cleanPath);
        await fs.unlink(absolutePath);
      } catch (unlinkError) {
        console.error("Cleanup Error during AI Failure:", unlinkError.message);
      }

      let cleanMessage = "The document was unreadable or the AI engine failed.";

      if (
        error.message.includes("API_KEY_INVALID") ||
        error.message.includes("API key not valid")
      ) {
        cleanMessage =
          "AI Engine Offline: The Google Gemini API key is invalid or missing.";
      } else if (error.message.includes("invalid data structure")) {
        cleanMessage =
          "The AI engine could not confidently structure the receipt data.";
      }

      throw new Error(cleanMessage);
    }
  }

  static async getScanDetails(id, activeUser) {
    const scan = await ReceiptScanModel.findById(id);
    if (!scan) throw new Error("Receipt scan session not found.");

    if (activeUser.role === "STAFF" && scan.branch_id !== activeUser.branchId) {
      throw new Error("Unauthorized: Cross-branch access denied.");
    }

    return scan;
  }

  static async cancelScan(id, activeUser, ipAddress) {
    const scan = await ReceiptScanModel.findById(id);
    if (!scan) throw new Error("Receipt scan session not found.");
    if (activeUser.role === "STAFF" && scan.branch_id !== activeUser.branchId) {
      throw new Error("Unauthorized.");
    }

    if (!["PROCESSING", "PENDING_VERIFICATION"].includes(scan.status)) {
      throw new Error(`Cannot cancel a scan that is already ${scan.status}.`);
    }

    const cancelledScan = await ReceiptScanModel.updateStatus(id, "DISCARDED");

    try {
      const cleanPath = scan.file_path.replace(/^\//, "");

      const absolutePath = path.join(__dirname, "../../", cleanPath);

      await fs.unlink(absolutePath);
      console.log(
        `[STORAGE] Successfully deleted discarded file: ${absolutePath}`,
      );
    } catch (unlinkError) {
      console.error(
        "[STORAGE WARNING] Failed to delete file:",
        unlinkError.message,
      );
    }

    await logSecureAction(
      activeUser.id,
      activeUser.branchId,
      "OCR_SCAN_CANCELLED",
      "WARNING",
      ipAddress,
      "receipt_scans",
      id,
      { status: scan.status },
      { status: "DISCARDED" },
    );

    return cancelledScan;
  }
}

module.exports = ReceiptService;
