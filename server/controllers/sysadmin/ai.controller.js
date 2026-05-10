const AiService = require("../../services/sysadmin/ai.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");

class AiController {
  static async getSettings(req, res) {
    try {
      const settings = await AiService.getAiSettings();
      return sendSuccess(res, 200, settings, "AI configuration retrieved.");
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  static async updateSettings(req, res) {
    try {
      const settings = await AiService.updateAiSettings(
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        200,
        settings,
        "AI configuration updated safely.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  static async testConnection(req, res) {
    try {
      const { gemini_api_key, ai_model } = req.body;
      const result = await AiService.testGeminiConnection(
        gemini_api_key,
        ai_model,
      );
      return sendSuccess(res, 200, result, result.message);
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }
}

module.exports = AiController;
