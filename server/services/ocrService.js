const Tesseract = require("tesseract.js");

// takes the image path and asks Tesseract to read it
const extractTextFromImage = async (imagePath) => {
  try {
    console.log("OCR Engine is processing the image...");

    const {
      data: { text },
    } = await Tesseract.recognize(imagePath, "eng");

    return text;
  } catch (error) {
    console.error("OCR Service Error:", error);
    throw new Error("Failed to process image through OCR.");
  }
};

module.exports = { extractTextFromImage };
