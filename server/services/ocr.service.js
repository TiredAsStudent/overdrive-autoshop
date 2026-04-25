const OcrModel = require("../models/Ocr");
const { logSecureAction } = require("../utils/auditLogger");

class OcrService {
  static async getPendingQueue() {
    return await OcrModel.getPendingScans();
  }

  static async getScanDetails(id) {
    const scan = await OcrModel.getScanDetails(id);
    if (!scan) throw new Error("Receipt scan not found.");
    return scan;
  }

  static async approveScan(id, finalData, adminId, ipAddress) {
    const scan = await OcrModel.getScanDetails(id);
    if (!scan) throw new Error("Receipt scan not found.");
    if (scan.status !== "PENDING")
      throw new Error(`Scan is already ${scan.status}.`);

    const result = await OcrModel.approveAndExecuteTransaction(
      id,
      finalData,
      adminId,
    );

    // CRITICAL THESIS DATA: The AI output vs the Manager's corrections
    await logSecureAction(
      adminId,
      result.branchId,
      "APPROVED_OCR_RECEIPT",
      "INFO",
      ipAddress,
      "receipt_scans",
      id,
      scan, // The old values (AI's raw extraction)
      finalData, // The new values (Manager's corrections)
    );

    return result;
  }

  static async rejectScan(id, adminId, ipAddress) {
    const scan = await OcrModel.getScanDetails(id);
    if (!scan) throw new Error("Receipt scan not found.");
    if (scan.status !== "PENDING")
      throw new Error(`Scan is already ${scan.status}.`);

    await OcrModel.rejectScan(id, adminId);

    await logSecureAction(
      adminId,
      scan.branch_id,
      "REJECTED_OCR_RECEIPT",
      "WARNING",
      ipAddress,
      "receipt_scans",
      id,
      { status: "PENDING" },
      { status: "REJECTED" },
    );

    return { success: true };
  }
}

module.exports = OcrService;
