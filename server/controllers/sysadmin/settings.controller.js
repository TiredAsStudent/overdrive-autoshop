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

      // File Replacement Logic: If a new logo is uploaded, delete the old one
      if (req.file) {
        const currentSettings = await SettingsService.getBusinessSettings();

        if (currentSettings.logo_url) {
          const cleanPath = currentSettings.logo_url.replace(/^\//, "");
          const oldFilePath = path.join(__dirname, "../../", cleanPath);

          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(
              "Cleanup: Deleted old corporate logo to save server storage.",
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
        "Business logic updated successfully.",
      );
    } catch (error) {
      // Rollback: If DB update fails, delete the newly uploaded file to prevent orphan files
      if (req.file && req.file.path) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log(
            "Cleanup: Deleted orphaned file due to validation or database failure.",
          );
        }
      }

      return sendError(res, 400, error.message);
    }
  }
}

module.exports = SettingsController;
