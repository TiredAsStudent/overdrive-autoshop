const sharp = require("sharp");
const Tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs").promises;

class OcrProcessor {
  // The "Grease-Proof" Filter
  static async cleanImageForOcr(fileBuffer, originalName) {
    const uploadDir = path.join(__dirname, "../uploads");

    //Check if uploads folder exists, create if it doesn't
    try {
      await fs.access(uploadDir);
    } catch (error) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filename = `processed_${Date.now()}_${originalName}`;
    const outputPath = path.join(uploadDir, filename);

    // Apply filters to make blurry/dirty workshop receipts readable for Tesseract
    await sharp(fileBuffer)
      .grayscale() // Remove color
      .normalize() // Stretch contrast
      .sharpen() // Make text edges crisp
      .toFile(outputPath);

    return { buffer: fileBuffer, filepath: outputPath, filename };
  }

  // The Regex Parsing Engine
  static parseTesseractText(rawText) {
    const lines = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Very basic regex rules to catch standard receipt patterns
    let totalAmount = 0;
    let vendorName = lines[0] || "Unknown Vendor"; // Usually the first line
    let receiptDate = new Date().toISOString().split("T")[0];
    let invoiceNumber = "UNKNOWN";

    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const totalRegex = /TOTAL[\s:$]*([\d,.]+)/i;
    const invRegex = /INV[\w\s#:]*([A-Z0-9\-]+)/i;

    for (const line of lines) {
      if (dateRegex.test(line)) receiptDate = line.match(dateRegex)[1];
      if (invRegex.test(line)) invoiceNumber = line.match(invRegex)[1];
      if (totalRegex.test(line)) {
        const amountStr = line.match(totalRegex)[1].replace(/,/g, "");
        totalAmount = parseFloat(amountStr) || 0;
      }
    }

    return {
      vendorName,
      receiptDate,
      invoiceNumber,
      totalAmount,
      extractedItems: [],
      rawText,
    };
  }

  static async extract(fileBuffer, originalName) {
    const cleanedImage = await this.cleanImageForOcr(fileBuffer, originalName);

    const {
      data: { text },
    } = await Tesseract.recognize(cleanedImage.filepath, "eng", {
      logger: (m) => console.log(m),
    });

    const parsedData = this.parseTesseractText(text);
    parsedData.processedImageUrl = `/uploads/${cleanedImage.filename}`;

    return parsedData;
  }
}

module.exports = OcrProcessor;
