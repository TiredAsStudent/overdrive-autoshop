const BalanceSheetModel = require("../../models/BalanceSheet");
const { logSecureAction } = require("../../utils/auditLogger");

class BalanceSheetService {
  static async generateBalanceSheet(filters, activeUser, ipAddress) {
    const { branch, as_of_date, hide_zero } = filters;
    const targetBranch = branch === "all" ? null : branch;

    const rawAccounts = await BalanceSheetModel.getAggregatedBalances(
      targetBranch,
      as_of_date,
    );

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let currentEarnings = 0; // The FRS link between Income Statement and Balance Sheet

    const statement = {
      assets: [],
      liabilities: [],
      equity: [],
    };

    // 1. Calculate Nominal Accounts to determine Current Earnings (Net Profit up to As-of Date)
    rawAccounts.forEach((acc) => {
      const debit = parseFloat(acc.raw_debit_total);
      const credit = parseFloat(acc.raw_credit_total);

      if (acc.account_type === "INCOME") currentEarnings += credit - debit;
      if (acc.account_type === "EXPENSE") currentEarnings -= debit - credit;
    });

    // 2. Classify Real Accounts into the Balance Sheet Structure
    rawAccounts.forEach((acc) => {
      const debit = parseFloat(acc.raw_debit_total);
      const credit = parseFloat(acc.raw_credit_total);
      const isZeroActivity = debit === 0 && credit === 0;

      let netBalance = 0;

      if (acc.account_type === "ASSET") {
        netBalance = debit - credit;
        if (hide_zero === "true" && isZeroActivity && netBalance === 0) return;
        totalAssets += netBalance;
        statement.assets.push({ ...acc, net_balance: netBalance });
      } else if (acc.account_type === "LIABILITY") {
        netBalance = credit - debit;
        if (hide_zero === "true" && isZeroActivity && netBalance === 0) return;
        totalLiabilities += netBalance;
        statement.liabilities.push({ ...acc, net_balance: netBalance });
      } else if (acc.account_type === "EQUITY") {
        netBalance = credit - debit;
        if (hide_zero === "true" && isZeroActivity && netBalance === 0) return;
        totalEquity += netBalance;
        statement.equity.push({ ...acc, net_balance: netBalance });
      }
    });

    // 3. Inject Current Earnings into Owner's Equity to balance the FRS Equation
    if (!(hide_zero === "true" && currentEarnings === 0)) {
      statement.equity.push({
        id: "current_earnings", // Virtual FRS mapping ID
        account_code: "-",
        account_name: "Current Period Profit / (Loss)",
        account_type: "EQUITY",
        net_balance: currentEarnings,
      });
      totalEquity += currentEarnings;
    }

    // 4. Mathematical Equation Verification
    const discrepancy = Math.abs(
      totalAssets - (totalLiabilities + totalEquity),
    );
    const isBalanced = discrepancy < 0.01;

    statement.summary = {
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      total_equity: totalEquity,
      is_balanced: isBalanced,
      discrepancy: isBalanced ? 0 : discrepancy,
    };

    // 5. Immutable Audit Logging
    await logSecureAction(
      activeUser.id,
      targetBranch,
      "VIEW_BALANCE_SHEET",
      isBalanced ? "INFO" : "CRITICAL", // Alerts admin if the ledger fractures
      ipAddress,
      "general_ledger",
      null,
      null,
      {
        as_of_date,
        branch,
        total_assets: totalAssets,
        is_balanced: isBalanced,
      },
    );

    return statement;
  }
}

module.exports = BalanceSheetService;
