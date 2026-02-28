const ocrService = require("../services/ocrService");
const fs = require("fs");

const processReceipt = async (req, res) => {
  try {
    // Check if a file was actually uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No receipt image uploaded." });
    }

    const imagePath = req.file.path;

    // Send the image
    const rawText = await ocrService.extractTextFromImage(imagePath);

    // This looks for "Total", "Amount", or "PHP/₱" followed by a number
    const totalRegex = /(?:total|amount|php|₱)[\s:=-]*([\d,]+\.\d{2})/i;
    const match = rawText.match(totalRegex);
    const extractedTotal = match
      ? match[1]
      : "Could not auto-detect total. Manual review required.";

    // Clean up (Delete the image)
    fs.unlinkSync(imagePath);

    //Send the results back
    res.status(200).json({
      message: "OCR processing complete.",
      extractedData: {
        total_amount: extractedTotal,
        raw_text: rawText,
      },
    });
  } catch (error) {
    console.error("OCR Controller Error:", error);

    // Cleanup file even if there is an error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: "Error processing the receipt image." });
  }
};

module.exports = { processReceipt };
