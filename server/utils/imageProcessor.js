const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

class ImageProcessor {
  /**
   * Applies Grayscale and Contrast filters to optimize receipt for AI OCR
   * @param {string} originalFilePath - Path to the uploaded image
   * @returns {string} - Path to the newly processed image
   */
  static async greaseProofReceipt(originalFilePath) {
    try {
      const dir = path.dirname(originalFilePath);
      const ext = path.extname(originalFilePath);
      const filename = path.basename(originalFilePath, ext);

      const processedFileName = `${filename}_processed${ext}`;
      const processedFilePath = path.join(dir, processedFileName);

      // The "Grease-Proof" Algorithm
      await sharp(originalFilePath)
        .resize({ width: 1500, withoutEnlargement: true }) // Standardize size to save API bandwidth
        .grayscale() // Remove color noise
        .normalize() // Enhance contrast
        .linear(1.2, -(1.2 * 128) + 128) // Thresholding simulation to make text darker and background whiter
        .toFile(processedFilePath);

      return processedFilePath;
    } catch (error) {
      console.error("Image Processing Error:", error);
      // Fallback: If processing fails, return original
      return originalFilePath;
    }
  }
}

module.exports = ImageProcessor;
