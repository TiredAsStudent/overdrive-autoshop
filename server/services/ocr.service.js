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

    // ==========================================
    // EDIT DISTANCE
    // ==========================================
    let editDistance = 0;
    const totalFields = 5; // Vendor, Invoice, Date, Total, Tax
    let accuracyScore = 0;

    // Parse the JSONB metadata stored during staff upload
    let aiData = {};
    if (scan.ai_metadata) {
      aiData =
        typeof scan.ai_metadata === "string"
          ? JSON.parse(scan.ai_metadata)
          : scan.ai_metadata;

      // Compare AI raw string vs Manager's final string
      if (
        String(aiData.vendor_name || "").trim() !==
        String(finalData.vendor_name || "").trim()
      )
        editDistance++;
      if (
        String(aiData.invoice_number || "").trim() !==
        String(finalData.invoice_number || "").trim()
      )
        editDistance++;
      if (
        String(aiData.receipt_date || "").trim() !==
        String(finalData.receipt_date || "").trim()
      )
        editDistance++;
      if (
        parseFloat(aiData.total_amount || 0) !==
        parseFloat(finalData.total_amount || 0)
      )
        editDistance++;
      if (
        parseFloat(aiData.tax_amount || 0) !==
        parseFloat(finalData.tax_amount || 0)
      )
        editDistance++;

      accuracyScore = Math.round(
        ((totalFields - editDistance) / totalFields) * 100,
      );
    }

    // Write research metric to immutable Audit Log
    await logSecureAction(
      adminId,
      result.branchId,
      "APPROVED_OCR_RECEIPT",
      "INFO",
      ipAddress,
      "receipt_scans",
      id,
      { ai_extraction: aiData }, // Old Values
      {
        manager_correction: finalData,
        RESEARCH_METRICS: {
          edit_distance: editDistance,
          accuracy_score: accuracyScore,
        },
      }, // New Values
    );

    return result;
  }

  static async rejectScan(id, reason, adminId, ipAddress) {
    const scan = await OcrModel.getScanDetails(id);
    if (!scan) throw new Error("Receipt scan not found.");
    if (scan.status !== "PENDING")
      throw new Error(`Scan is already ${scan.status}.`);

    await OcrModel.rejectScan(id, reason, adminId);

    await logSecureAction(
      adminId,
      scan.branch_id,
      "REJECTED_OCR_RECEIPT",
      "WARNING",
      ipAddress,
      "receipt_scans",
      id,
      { status: "PENDING" },
      { status: "REJECTED", reason: reason },
    );

    return { success: true };
  }
}

module.exports = OcrService;
