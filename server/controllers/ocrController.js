const OcrIntake = require("../models/ocrModel");
const { processReceiptImage } = require("../utils/ocrEngine");
const moneyUtils = require("../utils/moneyUtils");
const catchAsync = require("../utils/catchAsync");

exports.scanReceipt = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No receipt image uploaded." });
  }

  const ocrResult = await processReceiptImage(req.file.buffer);
  const markupSuggested = moneyUtils.applyMarkup(
    ocrResult.extractedTotal,
    1.25,
  );

  res.status(200).json({
    message: "OCR Scan Complete. Please verify data.",
    extracted_data: {
      total_amount: ocrResult.extractedTotal,
      markup_suggested: markupSuggested,
      raw_text: ocrResult.rawText,
    },
  });
});

exports.submitVerifiedData = catchAsync(async (req, res, next) => {
  const { vendor_name, total_amount, raw_text } = req.body;
  const branch_id = req.user.branch_id;
  const maker_id = req.user.id;

  if (parseFloat(total_amount) < 0) {
    return res.status(400).json({ error: "Total amount cannot be negative." });
  }

  const markup_suggested = moneyUtils.applyMarkup(total_amount, 1.25);
  const pendingRecord = await OcrIntake.createPendingRecord(
    branch_id,
    maker_id,
    vendor_name,
    total_amount,
    markup_suggested,
    raw_text,
  );

  res
    .status(201)
    .json({ message: "Sent to Admin Approval Queue.", record: pendingRecord });
});

exports.getApprovalQueue = catchAsync(async (req, res, next) => {
  const queue = await OcrIntake.getPendingQueue();
  res.status(200).json(queue);
});

exports.processApproval = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { action } = req.body;
  const checker_id = req.user.id;

  if (!["Approved", "Rejected"].includes(action)) {
    return res
      .status(400)
      .json({ error: "Invalid action. Must be 'Approved' or 'Rejected'." });
  }

  const updatedRecord = await OcrIntake.updateStatus(id, checker_id, action);
  if (!updatedRecord)
    return res.status(404).json({ error: "Pending OCR record not found." });

  res
    .status(200)
    .json({ message: `Record ${action} successfully.`, record: updatedRecord });
});
