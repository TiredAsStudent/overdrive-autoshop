const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

class OCRService {
  /**
   * Processes a receipt document using Google's Gemini Multimodal AI.
   * Extracts data directly into structured JSON and calculates a confidence score.
   */
  static async processDocument(filePath, mimeType) {
    try {
      // 1. Initialize Gemini AI
      if (!process.env.GEMINI_API_KEY) {
        throw new Error(
          "GEMINI_API_KEY is missing from environment variables.",
        );
      }
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // 2. Prepare the Image/PDF File for Gemini
      const fileData = fs.readFileSync(filePath);
      const imagePart = {
        inlineData: {
          data: fileData.toString("base64"),
          mimeType: mimeType,
        },
      };

      // 3. Strict Prompt Engineering (Forcing JSON Output)
      const prompt = `
        You are a highly accurate OCR and data extraction system for an auto shop accounting system.
        Analyze this receipt and extract the following information into a strict JSON object.
        Do not include Markdown blocks (like \`\`\`json). Return ONLY the raw JSON string.

        Expected JSON structure:
        {
          "vendor_name": "string or null",
          "receipt_number": "string or null",
          "receipt_date": "YYYY-MM-DD or null",
          "subtotal": number or null,
          "vat_amount": number or null,
          "grand_total": number or null,
          "items": [
            {
              "description": "string",
              "quantity": number,
              "unit_price": number,
              "total_price": number
            }
          ]
        }

        Rules:
        - If a value is missing, illegible, or not applicable, output null.
        - Extract numbers as raw floats (e.g., 5040.00). Do not include currency symbols or commas.
        - Look closely for automotive parts like "Brake Pads", "Oil Filter", etc., in the items list.
      `;

      // 4. Call the Gemini API
      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();

      // 5. Clean & Parse Response (Safeguard against AI formatting)
      const cleanText = responseText
        .replace(/```json/gi, "")
        .replace(/```/gi, "")
        .trim();

      let extractedJSON;
      try {
        extractedJSON = JSON.parse(cleanText);
      } catch (parseError) {
        console.error("Failed to parse Gemini output:", cleanText);
        throw new Error("AI returned an invalid data structure.");
      }

      // 6. Calculate Confidence Score (Based on FRS Business Rules)
      let score = 0;
      if (extractedJSON.vendor_name) score += 25;
      if (extractedJSON.grand_total) score += 30;
      if (extractedJSON.receipt_date) score += 25;
      if (extractedJSON.receipt_number) score += 20;

      // 7. Return Formatted Data for the Database
      return {
        extracted_data: JSON.stringify(extractedJSON),
        confidence_score: score,
        raw_ocr_text: cleanText,
      };
    } catch (error) {
      console.error("[OCR Service Error]:", error);
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }
}

module.exports = OCRService;
