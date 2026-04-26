const crypto = require("crypto");
const fs = require("fs");
const ImageProcessor = require("../../utils/imageProcessor");
const GeminiService = require("../../services/gemini.service");
const OcrModel = require("../../models/Ocr");

class StaffOcrController {
  // ACTION 1: Analyze Image (Does NOT save to ledger)
  static async analyzeReceipt(req, res) {
    try {
      if (!req.file)
        return res.status(400).json({ message: "Receipt image is required." });

      const originalImagePath = req.file.path;

      // 1. Generate Anti-Duplicate Hash
      const fileBuffer = fs.readFileSync(originalImagePath);
      const fileHash = crypto
        .createHash("sha256")
        .update(fileBuffer)
        .digest("hex");

      // 2. Check Database for existing hash
      const duplicate = await OcrModel.checkDuplicateHash(fileHash);
      if (duplicate) {
        fs.unlinkSync(originalImagePath); // Delete file to save space
        return res.status(409).json({
          message: `Duplicate Warning: This exact receipt was already scanned for ${duplicate.vendor_name}.`,
        });
      }

      // 3. Apply Grease-Proof Pre-Processing
      const processedImagePath =
        await ImageProcessor.greaseProofReceipt(originalImagePath);

      // 4. Run AI Analysis
      let aiData = null;
      let aiSuccess = false;
      try {
        aiData = await GeminiService.extractReceiptData(processedImagePath);
        aiSuccess = true;
      } catch (aiErr) {
        console.warn("AI extraction fallback triggered:", aiErr.message);
      }

      // 5. Return to Split-Screen UI for Verification
      res.status(200).json({
        message: aiSuccess
          ? "AI Analysis Complete"
          : "AI Failed. Please use Manual Entry.",
        aiSuccess,
        fileHash,
        images: {
          original: `/${originalImagePath.replace(/\\/g, "/")}`,
          processed: `/${processedImagePath.replace(/\\/g, "/")}`,
        },
        extractedData: aiData,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ACTION 2: Submit Verified Data
  static async submitVerifiedReceipt(req, res) {
    try {
      const staffUser = req.user;
      const data = req.body;

      const scanId = await OcrModel.createPendingScan({
        branch_id: staffUser.branchId,
        uploaded_by: staffUser.id,
        image_url: data.originalImage,
        vendor_name: data.vendor_name,
        invoice_number: data.invoice_number,
        receipt_date: data.receipt_date,
        total_amount: data.total_amount,
        tax_amount: data.tax_amount, // <-- NEW: Pass the tax
        account_category_id: data.account_category_id,
        file_hash: data.fileHash,
        ai_metadata: data.aiData,
        items: data.items,
      });

      res
        .status(201)
        .json({ message: "Receipt submitted for Manager Approval.", scanId });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ACTION 3: Cancel & Cleanup Ghost Files
  static async cancelAnalysis(req, res) {
    try {
      const { imagePath } = req.body;
      if (!imagePath)
        return res.status(400).json({ message: "No image path provided." });

      const cleanPath = imagePath.replace(/^\//, "");
      const processedPath = cleanPath.replace(
        /(\.[a-zA-Z0-9]+)$/i,
        "_processed$1",
      );

      const fs = require("fs");
      if (fs.existsSync(cleanPath)) fs.unlinkSync(cleanPath);
      if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);

      res.status(200).json({
        message: "Original and processed images cleaned up securely.",
      });
    } catch (error) {
      res.status(500).json({ message: "Cleanup failed: " + error.message });
    }
  }
}

module.exports = StaffOcrController;
