const FinanceConfigService = require("../services/financeConfigService");
const SettingsAndCoaModel = require("../models/settingsAndCoaModel");
const { sendSuccess, sendError } = require("../utils/responseHandler");

class FinanceConfigController {
  // --- COA CONTROLLERS ---
  static async createAccount(req, res) {
    try {
      const { accountName, category, description } = req.body;
      if (!accountName || !category)
        return sendError(res, 400, "Account Name and Category are required.");

      const account = await FinanceConfigService.addAccount(
        req.user.id,
        req.user.branchId,
        req.body,
        req.ip,
      );
      return sendSuccess(
        res,
        201,
        account,
        "Chart of Account created successfully.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  static async updateAccount(req, res) {
    try {
      const account = await FinanceConfigService.updateAccount(
        req.user.id,
        req.user.branchId,
        req.params.id,
        req.body,
        req.ip,
      );
      return sendSuccess(res, 200, account, "Account updated successfully.");
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  static async getAllAccounts(req, res) {
    try {
      // If Admin, get everything (including inactive and balances). If Staff, only get active for OCR dropdown.
      let accounts;
      if (req.user.role === "ADMIN") {
        accounts = await SettingsAndCoaModel.getAllCoa();
      } else {
        accounts = await SettingsAndCoaModel.getActiveCoaForDropdown();
      }
      return sendSuccess(res, 200, accounts, "Fetched COA successfully.");
    } catch (error) {
      return sendError(res, 500, "Failed to fetch accounts.");
    }
  }

  // --- GLOBAL SETTINGS CONTROLLERS ---
  static async updateSetting(req, res) {
    try {
      const { settingValue } = req.body;
      if (settingValue === undefined)
        return sendError(res, 400, "New setting value is required.");

      const setting = await FinanceConfigService.updateGlobalRule(
        req.user.id,
        req.user.branchId,
        req.params.key,
        settingValue,
        req.ip,
      );
      return sendSuccess(
        res,
        200,
        setting,
        "Global rule updated successfully.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  static async getSettings(req, res) {
    try {
      const settings = await SettingsAndCoaModel.getAllSettings();
      return sendSuccess(
        res,
        200,
        settings,
        "Fetched global settings successfully.",
      );
    } catch (error) {
      return sendError(res, 500, "Failed to fetch settings.");
    }
  }
}

module.exports = FinanceConfigController;
