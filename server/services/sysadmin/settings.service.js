const SystemSetting = require("../../models/SystemSetting");
const { logSecureAction } = require("../../utils/auditLogger");

class SettingsService {
  static async getBusinessSettings() {
    const settings = await SystemSetting.getSettings();
    if (!settings) throw new Error("System settings could not be initialized.");
    return settings;
  }

  static async updateBusinessSettings(data, adminUser, ipAddress) {
    const oldSettings = await SystemSetting.getSettings();

    const updatedSettings = await SystemSetting.update(data);

    const oldValues = {
      vat: oldSettings.vat_percentage,
      markup: oldSettings.markup_percentage,
      company: oldSettings.company_name,
    };

    const newValues = {
      vat: updatedSettings.vat_percentage,
      markup: updatedSettings.markup_percentage,
      company: updatedSettings.company_name,
    };

    await logSecureAction(
      adminUser.id,
      adminUser.branchId || null,
      "UPDATED_GLOBAL_BUSINESS_LOGIC",
      "WARNING",
      ipAddress,
      "system_settings",
      1,
      oldValues,
      newValues,
    );

    return updatedSettings;
  }
}

module.exports = SettingsService;
