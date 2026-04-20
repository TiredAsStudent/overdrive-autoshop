const AccountModel = require("../models/Account");

class FinanceService {
  static async createAccount(data, userId, ipAddress) {
    //  Fetch the rules for the selected Mother Category
    const category = await AccountModel.getCategoryById(data.category_id);
    if (!category) {
      throw new Error("Selected accounting category does not exist.");
    }

    // Check if the code falls within the correct 4-digit range
    if (
      data.account_code < category.code_range_start ||
      data.account_code > category.code_range_end
    ) {
      throw new Error(
        `Invalid code. For ${category.category_name}, the code must be between ${category.code_range_start} and ${category.code_range_end}.`,
      );
    }

    //  Check for duplicates
    const existing = await AccountModel.checkCodeExists(data.account_code);
    if (existing) {
      throw new Error(`Account code ${data.account_code} is already in use.`);
    }

    return await AccountModel.createAccountAndLogAudit(data, userId, ipAddress);
  }

  static async getBaseCategories() {
    return await AccountModel.getAllCategories();
  }

  static async updateAccount(id, updates, userId, ipAddress) {
    // Sanitize to ensure the Manager can only update safe fields
    const safeUpdates = {};
    if (updates.account_name !== undefined)
      safeUpdates.account_name = updates.account_name;
    if (updates.staff_label !== undefined)
      safeUpdates.staff_label = updates.staff_label;
    if (updates.description !== undefined)
      safeUpdates.description = updates.description;
    if (updates.is_active !== undefined)
      safeUpdates.is_active = updates.is_active;

    if (Object.keys(safeUpdates).length === 0) {
      throw new Error("No valid fields provided for update.");
    }

    return await AccountModel.updateAccountAndLogAudit(
      id,
      safeUpdates,
      userId,
      ipAddress,
    );
  }

  static async getMultiBranchBalances() {
    const rawData = await AccountModel.getRealTimeBalances();

    // Format data to group balances by Account for the UI
    const formattedAccounts = {};

    rawData.forEach((row) => {
      if (!formattedAccounts[row.account_id]) {
        formattedAccounts[row.account_id] = {
          id: row.account_id,
          code: row.account_code,
          name: row.account_name,
          label: row.staff_label,
          category: row.category_name,
          is_active: row.is_active,
          balances: [],
        };
      }
      formattedAccounts[row.account_id].balances.push({
        branch_id: row.branch_id,
        branch_name: row.branch_name,
        amount: parseFloat(row.balance),
      });
    });

    return Object.values(formattedAccounts);
  }
}

module.exports = FinanceService;
