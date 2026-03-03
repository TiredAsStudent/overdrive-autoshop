const ocrService = require("../services/ocrService");

const processReceipt = async (req, res) => {
  try {
    // Verify file exists
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No receipt image was uploaded." });
    }

    // Pass the file path to the OCR Service
    const rawText = await ocrService.extractTextFromImage(req.file.path);

    // EXTRACT TOTAL AMOUNT (Hunts for "Total", "Amount", "PHP", or "₱" followed by numbers)
    const totalRegex = /(?:total|amount|php|₱)[\s:=-]*([\d,]+\.\d{2})/i;
    const match = rawText.match(totalRegex);

    let extractedTotal = 0;
    if (match) {
      // Clean the string (remove commas) and convert to a float
      extractedTotal = parseFloat(match[1].replace(/,/g, ""));
    }

    // AUTOMATED MARKUP ENGINE (+25%)
    // Calculates the suggested customer price based on the detected supplier cost
    const suggestedCustomerPrice =
      extractedTotal > 0 ? (extractedTotal * 1.25).toFixed(2) : 0;

    // EXTRACT VENDOR NAME (Grabs the first legible line of the receipt)
    const lines = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const extractedVendor = lines.length > 0 ? lines[0] : "Review Required";

    // Send the structured data back to the Frontend Verification UI
    res.status(200).json({
      message: "OCR processing complete. Awaiting staff verification.",
      extractedData: {
        vendor_name: extractedVendor,
        unit_cost: extractedTotal,
        suggested_markup_price: parseFloat(suggestedCustomerPrice),
        raw_text: rawText,
      },
    });
  } catch (error) {
    console.error("OCR Controller Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during OCR processing." });
  }
};

module.exports = { processReceipt };
