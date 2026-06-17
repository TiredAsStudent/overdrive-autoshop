const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const ImageProcessor = require("../../utils/imageProcessor");

const AI_MODEL = "gemini-1.5-flash";
const SYSTEM_INSTRUCTION =
  "You are an expert automotive accounting AI. Accurately extract the TIN, Date, and Total Amount from Philippine receipts.";

class OcrService {
  // Helper to convert local file to Gemini's required format
  static fileToGenerativePart(filePath, mimeType) {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
        mimeType,
      },
    };
  }

  static async extractReceiptData(originalFilePath, mimeType) {
    try {
      // 1. Fetch Key securely from Environment Variables
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error(
          "AI extraction is currently disabled. Server is missing the API Key configuration.",
        );
      }

      // 2. Apply the "Grease-Proof" filter to optimize the image for AI
      const processedFilePath =
        await ImageProcessor.greaseProofReceipt(originalFilePath);

      // 3. Initialize Gemini with developer constants
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: AI_MODEL,
        // Force Gemini to output pure JSON
        generationConfig: { responseMimeType: "application/json" },
      });

      // 4. Construct the prompt with strict JSON requirements
      const prompt = `
        ${SYSTEM_INSTRUCTION}
        Extract the following details from this receipt and return ONLY a JSON object with these exact keys:
        - "vendor_name": (string, the name of the store/supplier)
        - "transaction_date": (string, YYYY-MM-DD format)
        - "total_amount": (number, the final total paid)
        - "vat_amount": (number, the 12% VAT amount if visible, otherwise 0)
        - "confidence_score": (number between 0.1 and 1.0 representing how clearly you could read the document)
      `;

      const imagePart = this.fileToGenerativePart(processedFilePath, mimeType);

      // 5. Execute AI Vision Request
      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();

      // 6. Parse and Return
      const extractedData = JSON.parse(responseText);

      // Cleanup processed image to save space (keep the original for the audit trail)
      if (
        processedFilePath !== originalFilePath &&
        fs.existsSync(processedFilePath)
      ) {
        fs.unlinkSync(processedFilePath);
      }

      return extractedData;
    } catch (error) {
      console.error("OCR Extraction Failed:", error);
      throw new Error(
        "AI extraction failed. Please proceed with Manual Entry.",
      );
    }
  }
}

module.exports = OcrService;
