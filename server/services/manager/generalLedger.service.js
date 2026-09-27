const GeneralLedgerModel = require("../../models/GeneralLedger");
const COAModel = require("../../models/ChartOfAccounts");
const { logSecureAction } = require("../../utils/auditLogger");

class GeneralLedgerService {
  static async getAccountLedger(
    accountId,
    page = 1,
    limit = 20,
    search = "",
    branchId = "all",
    startDate = null,
    endDate = null,
    activeUser,
    ipAddress,
  ) {
    const account = await COAModel.findById(accountId);
    if (!account) throw new Error("Chart of Accounts record not found.");

    const offset = (page - 1) * limit;
    const targetBranch = branchId === "all" ? null : parseInt(branchId, 10);

    const isDebitNormal = ["ASSET", "EXPENSE"].includes(account.account_type);

    const openingRaw = await GeneralLedgerModel.getOpeningBalance(
      accountId,
      targetBranch,
      startDate,
    );
    const openingBalance = isDebitNormal
      ? parseFloat(openingRaw.total_debit) - parseFloat(openingRaw.total_credit)
      : parseFloat(openingRaw.total_credit) -
        parseFloat(openingRaw.total_debit);

    const { transactions, totalCount } = await GeneralLedgerModel.getLedgerData(
      accountId,
      targetBranch,
      startDate,
      endDate,
      search,
      limit,
      offset,
    );

    let periodDebit = 0;
    let periodCredit = 0;

    const formattedTransactions = transactions.map((row) => {
      const debit = parseFloat(row.debit);
      const credit = parseFloat(row.credit);
      const rawRunBal = parseFloat(row.raw_running_balance);

      periodDebit += debit;
      periodCredit += credit;

      let accurateRunningBalance = 0;
      if (isDebitNormal) {
        accurateRunningBalance = rawRunBal;
      } else {
        accurateRunningBalance = -rawRunBal;
      }

      return {
        source_id: row.source_id,
        source_type: row.source_type,
        transaction_date: row.transaction_date.toISOString().split("T")[0],
        reference_number: row.reference_number,
        description: row.description,
        debit,
        credit,
        running_balance: accurateRunningBalance,
        branch_name: row.branch_name || "Enterprise Global",
      };
    });

    await logSecureAction(
      activeUser.id,
      targetBranch,
      "VIEW_GENERAL_LEDGER",
      "INFO",
      ipAddress,
      "chart_of_accounts",
      accountId,
      null,
      { filters: { startDate, endDate, branchId, search } },
    );

    return {
      account_info: {
        id: account.id,
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        normal_balance: isDebitNormal ? "DEBIT" : "CREDIT",
      },
      summary: {
        opening_balance: openingBalance,
        period_debit: periodDebit,
        period_credit: periodCredit,
      },
      transactions: formattedTransactions,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}

module.exports = GeneralLedgerService;
