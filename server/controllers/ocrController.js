const OcrIntake = require("../models/ocrModel");
const { processReceiptImage } = require("../utils/ocrEngine");

exports.scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No receipt image uploaded." });
    }

    //Send image buffer to the OCR Engine
    const ocrResult = await processReceiptImage(req.file.buffer);

    //Automated Markup Engine (+25%)
    const markupSuggested = ocrResult.extractedTotal * 1.25;

    //Return to Frontend for Maker Verification
    res.status(200).json({
      message: "OCR Scan Complete. Please verify data.",
      extracted_data: {
        total_amount: ocrResult.extractedTotal,
        markup_suggested: markupSuggested.toFixed(2),
        raw_text: ocrResult.rawText,
      },
    });
  } catch (err) {
    console.error("Scan Receipt Error:", err.message);
    res.status(500).json({ error: "Internal server error during OCR scan." });
  }
};

// Maker (Staff) submits the verified data
exports.submitVerifiedData = async (req, res) => {
  try {
    const { vendor_name, total_amount, raw_text } = req.body;
    const branch_id = req.user.branch_id;
    const maker_id = req.user.id;

    // Recalculate markup
    const markup_suggested = parseFloat(total_amount) * 1.25;

    const pendingRecord = await OcrIntake.createPendingRecord(
      branch_id,
      maker_id,
      vendor_name,
      total_amount,
      markup_suggested,
      raw_text,
    );

    res.status(201).json({
      message: "Sent to Admin Approval Queue.",
      record: pendingRecord,
    });
  } catch (err) {
    console.error("Submit Verification Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Checker (Admin) reviews the queue
exports.getApprovalQueue = async (req, res) => {
  try {
    const queue = await OcrIntake.getPendingQueue();
    res.status(200).json(queue);
  } catch (err) {
    console.error("Get Queue Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Checker (Admin) approves or rejects
exports.processApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'Approved' or 'Rejected'
    const checker_id = req.user.id;

    if (!["Approved", "Rejected"].includes(action)) {
      return res
        .status(400)
        .json({ error: "Invalid action. Must be 'Approved' or 'Rejected'." });
    }

    const updatedRecord = await OcrIntake.updateStatus(id, checker_id, action);
    if (!updatedRecord) {
      return res.status(404).json({ error: "Pending OCR record not found." });
    }

    // Note: Once 'Approved', this is where would sync it to the financial ledgers for continuation!

    res.status(200).json({
      message: `Record ${action} successfully.`,
      record: updatedRecord,
    });
  } catch (err) {
    console.error("Process Approval Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};
