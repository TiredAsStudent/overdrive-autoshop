const SystemSetting = require("../models/SystemSetting");
const User = require("../models/User");

class SettingsService {
  static async getBusinessSettings() {
    const settings = await SystemSetting.getSettings();
    if (!settings) throw new Error("System settings not initialized.");
    return settings;
  }

  static async updateBusinessSettings(data, adminId, ipAddress) {
    const updatedSettings = await SystemSetting.update(data);

    // Log the audit: Critical for tax compliance tracking
    await User.logAudit(adminId, null, "GLOBAL_SETTINGS_UPDATED", ipAddress);

    return updatedSettings;
  }
}

module.exports = SettingsService;
