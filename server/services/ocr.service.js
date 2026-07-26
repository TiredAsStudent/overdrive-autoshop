const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const fs = require("fs");

class OCRService {
  /**
   * Processes a receipt document using Google's Gemini Multimodal AI.
   * Uses Structured Outputs to guarantee 100% valid JSON syntax.
   */
  static async processDocument(filePath, mimeType) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error(
          "GEMINI_API_KEY is missing from environment variables.",
        );
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

      // 1. Define the strict mathematical JSON Schema
      const receiptSchema = {
        type: SchemaType.OBJECT,
        properties: {
          vendor_name: {
            type: SchemaType.STRING,
            description: "Name of the auto shop vendor or store",
          },
          receipt_number: {
            type: SchemaType.STRING,
            description: "Receipt, Invoice, or Transaction number",
          },
          receipt_date: {
            type: SchemaType.STRING,
            description: "Date of transaction in YYYY-MM-DD",
          },
          subtotal: {
            type: SchemaType.NUMBER,
            description: "Subtotal amount before tax",
          },
          vat_amount: {
            type: SchemaType.NUMBER,
            description: "Tax or VAT amount",
          },
          grand_total: {
            type: SchemaType.NUMBER,
            description: "Total amount paid",
          },
          items: {
            type: SchemaType.ARRAY,
            description: "List of purchased parts or items",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                description: {
                  type: SchemaType.STRING,
                  description: "Name of the item",
                },
                quantity: {
                  type: SchemaType.NUMBER,
                  description: "Quantity purchased",
                },
                unit_price: {
                  type: SchemaType.NUMBER,
                  description: "Price per unit",
                },
                total_price: {
                  type: SchemaType.NUMBER,
                  description: "Total price for this line",
                },
              },
              required: [
                "description",
                "quantity",
                "unit_price",
                "total_price",
              ],
            },
          },
        },
        required: ["items"], // Forces the AI to always return the items array
      };

      // 2. Initialize Model with Strict JSON Mode Enabled
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: receiptSchema,
        },
      });

      // 3. Prepare the Image/PDF File
      const fileData = fs.readFileSync(filePath);
      const imagePart = {
        inlineData: {
          data: fileData.toString("base64"),
          mimeType: mimeType,
        },
      };

      // 4. Send the Request
      const prompt =
        "Analyze this receipt. Extract the financial details and all line items.";
      const result = await model.generateContent([prompt, imagePart]);

      // Because we used Structured Outputs, this text is GUARANTEED to be perfectly valid JSON.
      const responseText = result.response.text();
      const extractedJSON = JSON.parse(responseText);

      // 5. Calculate Confidence Score (Based on FRS Business Rules)
      let score = 0;
      if (extractedJSON.vendor_name) score += 25;
      if (extractedJSON.grand_total) score += 30;
      if (extractedJSON.receipt_date) score += 25;
      if (extractedJSON.receipt_number) score += 20;

      // 6. Return Formatted Data for the Database
      return {
        extracted_data: JSON.stringify(extractedJSON),
        confidence_score: score,
        raw_ocr_text: responseText,
      };
    } catch (error) {
      console.error("[OCR Service Error]:", error);
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }
}

module.exports = OCRService;
