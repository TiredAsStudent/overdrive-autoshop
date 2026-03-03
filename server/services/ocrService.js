const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const extractTextFromImage = async (originalImagePath) => {
  const processedImagePath = path.join(
    "uploads",
    `processed-${Date.now()}.png`,
  );

  try {
    // Clean the greasy receipt for OCR accuracy
    await sharp(originalImagePath)
      .grayscale()
      .normalize()
      .threshold(128)
      .toFile(processedImagePath);

    // Ask Tesseract to read the clean image
    const {
      data: { text },
    } = await Tesseract.recognize(processedImagePath, "eng");

    //Immediately delete both images to save server space
    fs.unlinkSync(originalImagePath);
    fs.unlinkSync(processedImagePath);

    return text;
  } catch (error) {
    console.error("OCR Engine Error:", error);

    // Ensure files are deleted even if the OCR engine crashes
    if (fs.existsSync(originalImagePath)) fs.unlinkSync(originalImagePath);
    if (fs.existsSync(processedImagePath)) fs.unlinkSync(processedImagePath);

    throw new Error("Failed to process the receipt image.");
  }
};

module.exports = { extractTextFromImage };
