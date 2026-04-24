const SystemSetting = require("../models/SystemSetting");
const { logSecureAction } = require("../utils/auditLogger");

class SettingsService {
  static async getBusinessSettings() {
    const settings = await SystemSetting.getSettings();
    if (!settings) throw new Error("System settings not initialized.");
    return settings;
  }

  static async updateBusinessSettings(data, adminId, ipAddress) {
    const updatedSettings = await SystemSetting.update(data);
    await logSecureAction(
      adminId,
      null,
      "GLOBAL_SETTINGS_UPDATED",
      "WARNING",
      ipAddress,
      "system_settings",
      1,
      null,
      data,
    );
    return updatedSettings;
  }
}

module.exports = SettingsService;
