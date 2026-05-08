const ChartOfAccount = require("../../models/ChartOfAccount");
const { logSecureAction } = require("../../utils/auditLogger");

class CoaService {
  static async createAccount(data, managerId, ipAddress) {
    const existingCode = await ChartOfAccount.findByCode(data.account_code);
    if (existingCode) {
      throw new Error(`Account Code '${data.account_code}' is already in use.`);
    }

    const newAccount = await ChartOfAccount.create(data);

    await logSecureAction(
      managerId,
      null, // COA is global across all branches
      "COA_ACCOUNT_CREATED",
      "INFO",
      ipAddress,
      "chart_of_accounts",
      newAccount.id,
      null,
      newAccount,
    );

    return newAccount;
  }

  static async getAllAccounts() {
    return await ChartOfAccount.findAll();
  }

  static async updateAccount(id, data, managerId, ipAddress) {
    const oldAccount = await ChartOfAccount.findById(id);
    if (!oldAccount) throw new Error("Account not found.");

    // Enforce System Protection Rule
    if (oldAccount.is_system_protected && data.status === "Inactive") {
      throw new Error(
        "Critical System accounts cannot be deactivated to protect historical reporting.",
      );
    }

    const updatedAccount = await ChartOfAccount.update(id, data);

    await logSecureAction(
      managerId,
      null,
      "COA_ACCOUNT_UPDATED",
      "WARNING", // Financial master data change merits a warning
      ipAddress,
      "chart_of_accounts",
      id,
      oldAccount,
      updatedAccount,
    );

    return updatedAccount;
  }
}

module.exports = CoaService;
