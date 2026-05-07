const SettingsService = require("../../services/sysadmin/settings.service");
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

        // If an old logo exists, delete it safely
        if (currentSettings.logo_url) {
          const cleanPath = currentSettings.logo_url.replace(/^\//, "");

          const oldFilePath = path.join(__dirname, "../../", cleanPath);

          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log("Cleanup: Deleted old logo to save space.");
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
      if (req.file && req.file.path) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log(
            "Cleanup: Deleted orphaned file due to validation/DB failure.",
          );
        }
      }

      return sendError(res, 400, error.message);
    }
  }
}

module.exports = SettingsController;
