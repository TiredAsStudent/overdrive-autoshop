const AiSetting = require("../../models/AiSetting");
const { logSecureAction } = require("../../utils/auditLogger");
const { GoogleGenerativeAI } = require("@google/generative-ai");

class AiService {
  static async getAiSettings() {
    const settings = await AiSetting.getSettings();
    if (!settings) throw new Error("AI settings not initialized.");

    // SECURITY: Mask the API Key so it doesn't leak to the frontend
    if (settings.gemini_api_key) {
      const keyLength = settings.gemini_api_key.length;
      settings.gemini_api_key = `••••••••••••••••••••••••••••••${settings.gemini_api_key.slice(keyLength - 4)}`;
    }

    return settings;
  }

  static async updateAiSettings(data, adminUser, ipAddress) {
    const oldSettings = await AiSetting.getSettings();

    // If the frontend sends back the masked key (••••), we ignore it to prevent overwriting the real key
    if (data.gemini_api_key && data.gemini_api_key.includes("••••")) {
      delete data.gemini_api_key;
    }

    const updatedSettings = await AiSetting.update(data);

    // Audit Log the threshold changes
    await logSecureAction(
      adminUser.id,
      adminUser.branchId || null,
      "UPDATED_AI_CONFIGURATION",
      "WARNING",
      ipAddress,
      "system_settings",
      1,
      {
        threshold: oldSettings.ai_confidence_threshold,
        model: oldSettings.ai_model,
      },
      {
        threshold: updatedSettings.ai_confidence_threshold,
        model: updatedSettings.ai_model,
      },
    );

    return updatedSettings;
  }

  // The "Dry Run" Connection Test
  static async testGeminiConnection(providedKey, providedModel) {
    try {
      // Prioritize provided key, fallback to DB key, then fallback to .env key
      let apiKeyToTest = providedKey;

      if (!apiKeyToTest || apiKeyToTest.includes("••••")) {
        const dbSettings = await AiSetting.getSettings();
        apiKeyToTest = dbSettings.gemini_api_key || process.env.GEMINI_API_KEY;
      }

      if (!apiKeyToTest) throw new Error("No API Key available to test.");

      const genAI = new GoogleGenerativeAI(apiKeyToTest);
      const model = genAI.getGenerativeModel({
        model: providedModel || "gemini-2.5-flash",
      });

      // Send a tiny ping
      const result = await model.generateContent(
        "Ping. Reply with exactly 'Pong'.",
      );
      const text = result.response.text().trim();

      if (text.includes("Pong")) {
        return {
          success: true,
          message: "Connection to Google AI established successfully.",
        };
      } else {
        throw new Error("Unexpected response from AI service.");
      }
    } catch (error) {
      const errorMsg = error.message || "";

      if (errorMsg.includes("API key not valid")) {
        throw new Error(
          "Connection Failed: The provided API Key is invalid or expired.",
        );
      } else if (errorMsg.includes("404") || errorMsg.includes("not found")) {
        throw new Error(
          "Connection Failed: The selected AI model is currently offline or retired.",
        );
      }

      // Fallback for any other errors
      throw new Error(
        "AI Connection Failed. Please check your network and API key.",
      );
    }
  }
}

module.exports = AiService;
