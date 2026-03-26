const db = require("../config/db");
const SettingsAndCoaModel = require("../models/settingsAndCoaModel");
const AuditModel = require("../models/auditModel");

class FinanceConfigService {
  // --- COA LOGIC ---
  static async addAccount(adminId, adminBranchId, coaData, ipAddress) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const newAccount = await SettingsAndCoaModel.createCoa(
        coaData.accountName,
        coaData.category,
        coaData.description,
        client,
      );

      await AuditModel.log(
        adminId,
        adminBranchId,
        "CREATED_COA_ACCOUNT",
        "chart_of_accounts",
        newAccount.id,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return newAccount;
    } catch (error) {
      await client.query("ROLLBACK");
      if (error.code === "23505")
        throw new Error("An account with this name already exists.");
      throw new Error("Failed to create COA account.");
    } finally {
      client.release();
    }
  }

  static async updateAccount(
    adminId,
    adminBranchId,
    accountId,
    coaData,
    ipAddress,
  ) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const updatedAccount = await SettingsAndCoaModel.updateCoa(
        accountId,
        coaData.accountName,
        coaData.category,
        coaData.description,
        coaData.isActive,
        client,
      );

      if (!updatedAccount) throw new Error("Account not found.");

      await AuditModel.log(
        adminId,
        adminBranchId,
        "UPDATED_COA_ACCOUNT",
        "chart_of_accounts",
        updatedAccount.id,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return updatedAccount;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Failed to update COA account.");
    } finally {
      client.release();
    }
  }

  // --- SETTINGS LOGIC ---
  static async updateGlobalRule(
    adminId,
    adminBranchId,
    settingKey,
    newValue,
    ipAddress,
  ) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const updatedSetting = await SettingsAndCoaModel.updateSetting(
        settingKey,
        newValue,
        adminId,
        client,
      );

      if (!updatedSetting) throw new Error("Invalid setting key.");

      await AuditModel.log(
        adminId,
        adminBranchId,
        `UPDATED_SETTING_${settingKey}`,
        "global_settings",
        null,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return updatedSetting;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Failed to update global setting.");
    } finally {
      client.release();
    }
  }
}

module.exports = FinanceConfigService;
