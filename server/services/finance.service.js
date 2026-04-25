const AccountModel = require("../models/Account");
const { logSecureAction } = require("../utils/auditLogger");

class FinanceService {
  static async createAccount(data, userId, ipAddress) {
    const category = await AccountModel.getCategoryById(data.category_id);
    if (!category) {
      throw new Error("Selected accounting category does not exist.");
    }

    if (
      data.account_code < category.code_range_start ||
      data.account_code > category.code_range_end
    ) {
      throw new Error(
        `Invalid code. For ${category.category_name}, the code must be between ${category.code_range_start} and ${category.code_range_end}.`,
      );
    }

    const existing = await AccountModel.checkCodeExists(data.account_code);
    if (existing) {
      throw new Error(`Account code ${data.account_code} is already in use.`);
    }

    const newAccount = await AccountModel.createAccount(data);

    await logSecureAction(
      userId,
      null,
      "CREATE_CHART_OF_ACCOUNT",
      "INFO",
      ipAddress,
      "chart_of_accounts",
      newAccount.id,
      null,
      data,
    );

    return newAccount;
  }

  static async getBaseCategories() {
    return await AccountModel.getAllCategories();
  }

  static async updateAccount(id, updates, userId, ipAddress) {
    const oldAccount = await AccountModel.findAccountById(id);
    if (!oldAccount) throw new Error("Account not found.");

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

    const updatedAccount = await AccountModel.updateAccount(id, safeUpdates);

    await logSecureAction(
      userId,
      null,
      "UPDATE_CHART_OF_ACCOUNT",
      "WARNING",
      ipAddress,
      "chart_of_accounts",
      id,
      oldAccount,
      safeUpdates,
    );

    return updatedAccount;
  }

  static async getMultiBranchBalances() {
    const rawData = await AccountModel.getRealTimeBalances();

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
