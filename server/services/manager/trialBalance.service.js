const TrialBalanceModel = require("../../models/TrialBalance");
const { logSecureAction } = require("../../utils/auditLogger");

class TrialBalanceService {
  static async generateTrialBalance(filters, activeUser, ipAddress) {
    const { branch, end_date, search, type, hide_zero } = filters;
    const targetBranch = branch === "all" ? null : branch;

    // 1. Fetch Aggregated Data (Cumulative As Of End Date)
    const rawAccounts = await TrialBalanceModel.getAggregatedBalances(
      targetBranch,
      end_date,
    );

    let globalTotalDebit = 0;
    let globalTotalCredit = 0;

    // 2. Process Net Balances
    let processedAccounts = rawAccounts.map((acc) => {
      const debitTotal = parseFloat(acc.raw_debit_total);
      const creditTotal = parseFloat(acc.raw_credit_total);

      let netDebit = 0;
      let netCredit = 0;

      if (debitTotal > creditTotal) {
        netDebit = debitTotal - creditTotal;
      } else if (creditTotal > debitTotal) {
        netCredit = creditTotal - debitTotal;
      }

      // Add to global parity verification engine BEFORE frontend filters apply
      globalTotalDebit += netDebit;
      globalTotalCredit += netCredit;

      return {
        id: acc.id,
        account_code: acc.account_code,
        account_name: acc.account_name,
        account_type: acc.account_type,
        debit_balance: netDebit,
        credit_balance: netCredit,
      };
    });

    // 3. Apply Local Search and Toggle Filters
    if (hide_zero === "true") {
      processedAccounts = processedAccounts.filter(
        (acc) => acc.debit_balance > 0 || acc.credit_balance > 0,
      );
    }

    if (type && type !== "all") {
      processedAccounts = processedAccounts.filter(
        (acc) => acc.account_type === type.toUpperCase(),
      );
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      processedAccounts = processedAccounts.filter(
        (acc) =>
          acc.account_code.toLowerCase().includes(lowerSearch) ||
          acc.account_name.toLowerCase().includes(lowerSearch),
      );
    }

    // Mathematical Tolerance Check for floating point precision issues
    const discrepancy = Math.abs(globalTotalDebit - globalTotalCredit);
    const isBalanced = discrepancy < 0.01;

    // 4. Audit Trail Security Logging
    await logSecureAction(
      activeUser.id,
      targetBranch,
      "VIEW_TRIAL_BALANCE",
      "INFO",
      ipAddress,
      "general_ledger",
      null,
      null,
      { filters, is_balanced: isBalanced },
    );

    return {
      accounts: processedAccounts,
      summary: {
        total_debits: globalTotalDebit,
        total_credits: globalTotalCredit,
        is_balanced: isBalanced,
        discrepancy: isBalanced ? 0 : discrepancy,
      },
    };
  }
}

module.exports = TrialBalanceService;
