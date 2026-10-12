const SettingsService = require("../../services/sysadmin/settings.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const fs = require("fs").promises;
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

          try {
            await fs.access(oldFilePath);
            await fs.unlink(oldFilePath);
            console.log(
              "Storage Optimization: Old corporate logo purged from server.",
            );
          } catch (err) {
            // File does not exist, safe to proceed
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
        try {
          await fs.access(req.file.path);
          await fs.unlink(req.file.path);
          console.log(
            "Rollback Executed: Deleted orphaned upload due to DB failure.",
          );
        } catch (err) {
          // Ignore if missing
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
