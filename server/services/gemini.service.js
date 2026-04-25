const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

class GeminiService {
  static async extractReceiptData(imagePath) {
    if (!process.env.GEMINI_API_KEY)
      throw new Error("AI Engine not configured.");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using flash for high speed multimodal analysis
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const imageParts = [
      {
        inlineData: {
          data: fs.readFileSync(imagePath).toString("base64"),
          mimeType: "image/jpeg",
        },
      },
    ];

    const prompt = `
      Act as an expert accounting OCR system for an auto repair shop. 
      Analyze this receipt and extract the details.
      Return ONLY a raw JSON object with the following structure (no markdown, no backticks):
      {
        "vendor_name": "String",
        "invoice_number": "String or null",
        "receipt_date": "YYYY-MM-DD",
        "total_amount": Number,
        "tax_amount": Number,
        "items": [
          { "description": "String", "quantity": Number, "unit_cost": Number, "total_price": Number }
        ]
      }
    `;

    try {
      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text();

      // Clean potential markdown formatting from AI output
      const cleanJsonStr = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleanJsonStr);
    } catch (error) {
      console.error("Gemini AI Error:", error);
      throw new Error(
        "AI extraction failed. Proceed with manual fallback entry.",
      );
    }
  }
}

module.exports = GeminiService;
