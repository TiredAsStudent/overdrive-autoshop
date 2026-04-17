const OcrModel = require("../models/Ocr"); // Points to the flattened models folder

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

    // Run the Triple-Action Process
    const result = await OcrModel.approveAndExecuteTransaction(
      id,
      finalData,
      adminId,
      ipAddress,
    );
    return result;
  }

  static async rejectScan(id, adminId) {
    const scan = await OcrModel.getScanDetails(id);
    if (!scan) throw new Error("Receipt scan not found.");
    if (scan.status !== "PENDING")
      throw new Error(`Scan is already ${scan.status}.`);

    await OcrModel.rejectScan(id, adminId);
    return { success: true };
  }
}

module.exports = OcrService;
