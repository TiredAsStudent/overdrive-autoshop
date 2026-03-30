const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class OcrProcessor {
  //The "Grease-Proof"
  static async cleanImageForOcr(fileBuffer, originalName) {
    const uploadDir = path.join(__dirname, "../uploads");

    // Check if uploads folder exists, create if it doesn't
    try {
      await fs.access(uploadDir);
    } catch (error) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filename = `processed_${Date.now()}_${originalName}`;
    const outputPath = path.join(uploadDir, filename);

    // Apply filters and save to disk
    const processedBuffer = await sharp(fileBuffer)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();

    // Save the file
    await fs.writeFile(outputPath, processedBuffer);

    return {
      buffer: processedBuffer,
      filepath: outputPath,
      filename,
    };
  }

  // The Gemini AI Extraction Engine
  static async extract(fileBuffer, originalName) {
    try {
      // Clean the image
      const cleanedImage = await this.cleanImageForOcr(
        fileBuffer,
        originalName,
      );

      // Prepare the image for Gemini (Base64 format)
      const imagePart = {
        inlineData: {
          data: cleanedImage.buffer.toString("base64"),
          mimeType: "image/jpeg", // Sharp defaults to jpeg/png buffer, this is safe for Gemini
        },
      };

      // The "Prompt"
      const prompt = `
        You are an expert accounting assistant for an auto repair shop.
        Analyze this receipt/invoice image and extract the data strictly as a JSON object.
        Do NOT include any markdown formatting, backticks, or explanation. ONLY output raw JSON.
        
        Use this EXACT JSON structure:
        {
          "vendorName": "Name of the supplier or store (string)",
          "receiptDate": "Date on receipt in YYYY-MM-DD format (string)",
          "invoiceNumber": "Invoice or receipt number, or 'UNKNOWN' if missing (string)",
          "totalAmount": 0.00, 
          "items": [
            {
              "itemName": "Name of the part, food, or item (string)",
              "quantity": 1, 
              "unitCost": 0.00 
            }
          ]
        }
        
        Rules:
        1. totalAmount, quantity, and unitCost MUST be numbers, not strings.
        2. If you cannot find a value, use "Unknown" for strings or 0 for numbers.
        3. If there are no line items visible, return an empty array [] for items.
      `;

      // Call the Gemini Flash Model
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();

      //Clean up the AI output
      const cleanedJsonString = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      // Parse into a real JavaScript Object
      const parsedData = JSON.parse(cleanedJsonString);

      // Attach the UI image URL
      parsedData.processedImageUrl = `/uploads/${cleanedImage.filename}`;

      return parsedData;
    } catch (error) {
      console.error("Gemini AI Extraction Failed:", error);
      throw new Error(
        "Failed to process receipt with AI. Please check the image and try again.",
      );
    }
  }
}

module.exports = OcrProcessor;
