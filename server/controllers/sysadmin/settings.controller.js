const SettingsService = require("../../services/settings.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const fs = require("fs");
const path = require("path");

class SettingsController {
  static async getSettings(req, res) {
    try {
      const settings = await SettingsService.getBusinessSettings();
      return sendSuccess(
        res,
        200,
        settings,
        "Settings retrieved successfully.",
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  static async updateSettings(req, res) {
    try {
      const updateData = { ...req.body };

      // If a new logo was uploaded
      if (req.file) {
        // Fetch current settings to find the old logo
        const currentSettings = await SettingsService.getBusinessSettings();

        // If an old logo exists, delete it ONLY IF the new one is about to be saved
        if (currentSettings.logo_url) {
          const oldFilePath = path.join(
            __dirname,
            "../../../",
            currentSettings.logo_url,
          );
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        updateData.logo_url = `/uploads/branding/${req.file.filename}`;
      }

      const settings = await SettingsService.updateBusinessSettings(
        updateData,
        req.user.id,
        req.ip,
      );

      return sendSuccess(
        res,
        200,
        settings,
        "Business settings updated successfully.",
      );
    } catch (error) {
      // If Zod or the Service throws an error AND a file was uploaded, delete it!
      if (req.file) {
        const failedFilePath = path.join(
          __dirname,
          "../../../",
          `uploads/branding/${req.file.filename}`,
        );
        if (fs.existsSync(failedFilePath)) {
          fs.unlinkSync(failedFilePath);
          console.log(
            "Cleanup: Deleted orphaned file due to validation failure.",
          );
        }
      }

      return sendError(res, 400, error.message);
    }
  }
}

module.exports = SettingsController;
