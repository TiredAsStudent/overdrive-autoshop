const sharp = require("sharp");
const Tesseract = require("tesseract.js");

const processReceiptImage = async (imageBuffer) => {
  try {
    //Image Pre-processing
    const processedImageBuffer = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();

    //Run Tesseract.js OCR
    const {
      data: { text },
    } = await Tesseract.recognize(processedImageBuffer, "eng");

    //Basic Extraction Logic (Regex)
    // Note: Staff (Maker) will verify/edit this on the frontend
    const totalMatch = text.match(/TOTAL[\s$:]*([\d,]+\.\d{2})/i);
    const extractedTotal = totalMatch
      ? parseFloat(totalMatch[1].replace(/,/g, ""))
      : 0.0;

    return {
      rawText: text,
      extractedTotal: extractedTotal,
    };
  } catch (error) {
    console.error("OCR Engine Error:", error);
    throw new Error("Failed to process image through OCR.");
  }
};

module.exports = { processReceiptImage };
