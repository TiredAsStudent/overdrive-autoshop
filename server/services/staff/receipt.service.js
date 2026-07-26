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
      // Delete the file if AI parsing completely fails
      await ReceiptScanModel.updateStatus(initialScan.id, "DISCARDED");
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error(
          "Failed to delete corrupted file from disk:",
          unlinkError,
        );
      }
      throw new Error(`OCR Processing failed: ${error.message}`);
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

    // Physically delete the file from the server to save space
    try {
      const absolutePath = path.join(__dirname, "../../../", scan.file_path);
      await fs.unlink(absolutePath);
    } catch (unlinkError) {
      console.error("Storage Cleanup Warning: File might already be deleted.");
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
