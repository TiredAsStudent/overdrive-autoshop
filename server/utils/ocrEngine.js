const sharp = require("sharp");
const { createWorker } = require("tesseract.js");

let workerPromise = null;

const getWorker = async () => {
  if (!workerPromise) {
    console.log("Booting up Tesseract OCR Engine...");
    workerPromise = createWorker("eng").then((worker) => {
      console.log("Tesseract OCR Worker is loaded and ready.");
      return worker;
    });
  }
  return workerPromise;
};

// Initialize it immediately in the background when the server starts
getWorker().catch((err) => console.error("Failed to boot OCR Worker:", err));

//IMAGE PROCESSING & EXTRACTION
const processReceiptImage = async (imageBuffer) => {
  try {
    //Image Pre-processing for greasy/noisy receipts
    const processedImageBuffer = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();

    //Grab the persistent worker
    const worker = await getWorker();

    //Run the AI Scan
    const {
      data: { text },
    } = await worker.recognize(processedImageBuffer);

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
