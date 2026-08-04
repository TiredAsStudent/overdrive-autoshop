const COAModel = require("../../models/ChartOfAccounts");
const { logSecureAction } = require("../../utils/auditLogger");

class ChartOfAccountsService {
  static async createAccount(data, activeUser, ipAddress) {
    const duplicate = await COAModel.checkDuplicate(
      data.account_code,
      data.account_name,
    );
    if (duplicate) {
      const field =
        duplicate.account_code === data.account_code
          ? "Account Code"
          : "Account Name";
      throw new Error(`An account with this ${field} already exists.`);
    }

    if (data.parent_id) {
      const parent = await COAModel.findById(data.parent_id);
      if (!parent) throw new Error("Parent account not found.");
      if (parent.account_type !== data.account_type) {
        throw new Error(
          "Sub-accounts must share the same Account Type as their parent.",
        );
      }
    }

    const newAccount = await COAModel.create(data);

    await logSecureAction(
      activeUser.id,
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

  static async updateAccount(id, data, activeUser, ipAddress) {
    if (data.parent_id && parseInt(data.parent_id, 10) === parseInt(id, 10)) {
      throw new Error(
        "Invalid structure: An account cannot be its own parent.",
      );
    }

    const oldAccount = await COAModel.findById(id);
    if (!oldAccount) throw new Error("Account not found.");

    if (
      oldAccount.is_system &&
      data.account_name &&
      data.account_name !== oldAccount.account_name
    ) {
      throw new Error(
        "System accounts cannot be renamed to prevent automated workflow failures.",
      );
    }

    if (data.account_name) {
      const duplicate = await COAModel.checkDuplicate(
        null,
        data.account_name,
        id,
      );
      if (duplicate)
        throw new Error("Another account is already using this Account Name.");
    }

    if (data.parent_id) {
      if (data.parent_id === parseInt(id, 10))
        throw new Error("An account cannot be its own parent.");
      const parent = await COAModel.findById(data.parent_id);
      if (!parent) throw new Error("Parent account not found.");
      if (parent.account_type !== oldAccount.account_type) {
        throw new Error(
          "Sub-accounts must share the same Account Type as their parent.",
        );
      }
    }

    const updatedAccount = await COAModel.update(id, data);

    await logSecureAction(
      activeUser.id,
      null,
      "COA_ACCOUNT_UPDATED",
      "INFO",
      ipAddress,
      "chart_of_accounts",
      id,
      oldAccount,
      updatedAccount,
    );

    return updatedAccount;
  }

  static async toggleStatus(id, isActive, activeUser, ipAddress) {
    const account = await COAModel.findById(id);
    if (!account) throw new Error("Account not found.");

    if (!isActive && account.is_system) {
      throw new Error("Critical system accounts cannot be deactivated.");
    }

    const updatedAccount = await COAModel.toggleStatus(id, isActive);

    await logSecureAction(
      activeUser.id,
      null,
      isActive ? "COA_ACCOUNT_ACTIVATED" : "COA_ACCOUNT_DEACTIVATED",
      isActive ? "INFO" : "WARNING",
      ipAddress,
      "chart_of_accounts",
      id,
      { is_active: account.is_active },
      { is_active: updatedAccount.is_active },
    );

    return updatedAccount;
  }

  static async getAccounts(
    page = 1,
    limit = 10,
    search = "",
    type = "all",
    status = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, accounts] = await Promise.all([
      COAModel.countFiltered(search, type, status),
      COAModel.findPaginatedFiltered(limit, offset, search, type, status),
    ]);

    return {
      accounts,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async getAccountDetails(id) {
    const account = await COAModel.findById(id);
    if (!account) throw new Error("Account not found.");
    return account;
  }

  static async getAccountUsage(id, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const account = await COAModel.findById(id);
    if (!account) throw new Error("Account not found.");

    const [totalItems, transactions] = await Promise.all([
      COAModel.countAccountUsage(id),
      COAModel.getAccountUsage(id, limit, offset),
    ]);

    return {
      account,
      transactions,
      pagination: {
        totalItems,
        totalPages: totalItems > 0 ? Math.ceil(totalItems / limit) : 1,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}

module.exports = ChartOfAccountsService;
