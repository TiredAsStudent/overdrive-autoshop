const SystemSettingsModel = require("../../models/controlCenter/SystemSettingsModel");

class SystemSettingsService {
  // --- FINANCIALS ---
  static async getFinancials() {
    const settings = await SystemSettingsModel.getFinancialSettings();
    if (!settings) throw new Error("System settings not initialized.");

    // Parse decimals properly for the frontend
    return {
      markupPercentage: parseFloat(settings.markup_percentage),
      vatPercentage: parseFloat(settings.vat_percentage),
      updatedAt: settings.updated_at,
    };
  }

  static async updateFinancials(adminId, ipAddress, markup, vat) {
    const updatedSettings = await SystemSettingsModel.updateFinancialSettings(
      markup,
      vat,
    );

    // Log this critical enterprise action
    await SystemSettingsModel.logAudit(
      adminId,
      null, // Global action, no specific branch
      `UPDATED_FINANCIALS_MARKUP_${markup}_VAT_${vat}`,
      "system_settings",
      1,
      ipAddress,
    );

    return {
      markupPercentage: parseFloat(updatedSettings.markup_percentage),
      vatPercentage: parseFloat(updatedSettings.vat_percentage),
      updatedAt: updatedSettings.updated_at,
    };
  }

  // --- BRANCHES ---
  static async getBranches() {
    return await SystemSettingsModel.getAllBranches();
  }

  static async updateBranch(
    adminId,
    ipAddress,
    branchId,
    address,
    contactNumber,
  ) {
    const updatedBranch = await SystemSettingsModel.updateBranchDetails(
      branchId,
      address,
      contactNumber,
    );

    if (!updatedBranch) throw new Error("Branch not found.");

    await SystemSettingsModel.logAudit(
      adminId,
      branchId,
      "UPDATED_BRANCH_DETAILS",
      "branches",
      branchId,
      ipAddress,
    );

    return updatedBranch;
  }
}

module.exports = SystemSettingsService;
