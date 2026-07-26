const ReceiptScanModel = require("../../models/ReceiptScan");
const OCRService = require("../ocr.service");
const { logSecureAction } = require("../../utils/auditLogger");

class ReceiptService {
  static async processUpload(file, activeUser, ipAddress) {
    if (!file) throw new Error("No receipt file provided.");

    // 1. Create Staging Record (Protects against session loss)
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
      // 2. Execute AI/OCR Parsing Pipeline
      const ocrResult = await OCRService.processDocument(
        file.path,
        file.mimetype,
      );

      // 3. Update DB with Extracted Data and move to Verification
      const completedScan = await ReceiptScanModel.updateExtraction(
        initialScan.id,
        ocrResult.extracted_data,
        ocrResult.confidence_score,
        ocrResult.raw_ocr_text,
      );

      // 4. Log Audit Trail
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
      // Handle OCR Engine Failures
      await ReceiptScanModel.updateStatus(initialScan.id, "DISCARDED");
      throw new Error(`OCR Processing failed: ${error.message}`);
    }
  }

  static async getScanDetails(id, activeUser) {
    const scan = await ReceiptScanModel.findById(id);
    if (!scan) throw new Error("Receipt scan session not found.");

    // Strict Branch Isolation
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
