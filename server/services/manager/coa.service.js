const ChartOfAccount = require("../../models/ChartOfAccount");
const { logSecureAction } = require("../../utils/auditLogger");

class CoaService {
  static async createAccount(data, managerId, ipAddress) {
    const existingCode = await ChartOfAccount.findByCode(data.account_code);
    if (existingCode) {
      throw new Error(`Account Code '${data.account_code}' is already in use.`);
    }

    if (data.parent_id) {
      const parent = await ChartOfAccount.findById(data.parent_id);
      if (!parent) throw new Error("Assigned Parent Account does not exist.");

      // Accounting Rule: Child must match Parent's core category
      if (parent.account_type !== data.account_type) {
        throw new Error(
          `Sub-account type (${data.account_type}) must match Parent type (${parent.account_type}).`,
        );
      }
    }

    const newAccount = await ChartOfAccount.create(data);

    await logSecureAction(
      managerId,
      null,
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

    if (oldAccount.is_system_protected && data.status === "Inactive") {
      throw new Error("Critical System accounts cannot be deactivated.");
    }

    // Anti-Infinite Loop & Hierarchy Validation
    if (data.parent_id) {
      if (parseInt(data.parent_id, 10) === parseInt(id, 10)) {
        throw new Error(
          "System Architecture Error: An account cannot be its own parent.",
        );
      }

      const parent = await ChartOfAccount.findById(data.parent_id);
      if (!parent) throw new Error("Assigned Parent Account does not exist.");

      // Ensure the parent isn't a different category than this account
      if (parent.account_type !== oldAccount.account_type) {
        throw new Error(
          `Cannot nest under a ${parent.account_type} account. Types must match.`,
        );
      }
    }

    const updatedAccount = await ChartOfAccount.update(id, data);

    await logSecureAction(
      managerId,
      null,
      "COA_ACCOUNT_UPDATED",
      "WARNING",
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
