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
        "Enterprise settings retrieved securely.",
      );
    } catch (error) {
      return sendError(res, 500, "Internal Server Error", error.message);
    }
  }

  static async updateSettings(req, res) {
    try {
      const updateData = { ...req.body };

      if (req.file) {
        const currentSettings = await SettingsService.getBusinessSettings();

        if (currentSettings.logo_url) {
          const cleanPath = currentSettings.logo_url.replace(/^\//, "");
          const oldFilePath = path.join(__dirname, "../../", cleanPath);

          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(
              "Storage Optimization: Old corporate logo purged from server.",
            );
          }
        }
        updateData.logo_url = `/uploads/branding/${req.file.filename}`;
      }

      const settings = await SettingsService.updateBusinessSettings(
        updateData,
        req.user,
        req.ip,
      );

      return sendSuccess(
        res,
        200,
        settings,
        "Master business logic updated successfully.",
      );
    } catch (error) {
      if (req.file && req.file.path) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log(
            "Rollback Executed: Deleted orphaned upload due to DB failure.",
          );
        }
      }

      return sendError(
        res,
        400,
        "Failed to update configuration",
        error.message,
      );
    }
  }
}

module.exports = SettingsController;
