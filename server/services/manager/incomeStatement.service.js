const IncomeStatementModel = require("../../models/IncomeStatement");
const { logSecureAction } = require("../../utils/auditLogger");

class IncomeStatementService {
  static async generateIncomeStatement(filters, activeUser, ipAddress) {
    const { branch, start_date, end_date, hide_zero } = filters;
    const targetBranch = branch === "all" ? null : branch;

    // 1. Fetch Aggregated P&L Ledger and Dynamic COGS Mappings
    const [rawAccounts, cogsAccountIds] = await Promise.all([
      IncomeStatementModel.getAggregatedPnL(targetBranch, start_date, end_date),
      IncomeStatementModel.getDynamicCOGSAccountIds(),
    ]);

    const statement = {
      operating_revenue: [],
      cost_of_goods_sold: [],
      operating_expenses: [],
      summary: {
        total_revenue: 0,
        total_cogs: 0,
        gross_profit: 0,
        total_opex: 0,
        net_profit: 0,
      },
    };

    // 2. Classify and Calculate Normal Balances
    rawAccounts.forEach((acc) => {
      const debitTotal = parseFloat(acc.raw_debit_total);
      const creditTotal = parseFloat(acc.raw_credit_total);

      // Hide Zero Balances Logic
      if (hide_zero === "true" && debitTotal === 0 && creditTotal === 0) {
        return;
      }

      const formattedAccount = {
        id: acc.id,
        account_code: acc.account_code,
        account_name: acc.account_name,
        account_type: acc.account_type,
        net_balance: 0,
      };

      if (acc.account_type === "INCOME") {
        // Income Normal Balance = Credit - Debit
        formattedAccount.net_balance = creditTotal - debitTotal;
        statement.operating_revenue.push(formattedAccount);
        statement.summary.total_revenue += formattedAccount.net_balance;
      } else if (acc.account_type === "EXPENSE") {
        // Expense Normal Balance = Debit - Credit
        formattedAccount.net_balance = debitTotal - creditTotal;

        // Dynamically route to COGS vs OPEX based on Inventory Configuration
        if (cogsAccountIds.includes(acc.id)) {
          statement.cost_of_goods_sold.push(formattedAccount);
          statement.summary.total_cogs += formattedAccount.net_balance;
        } else {
          statement.operating_expenses.push(formattedAccount);
          statement.summary.total_opex += formattedAccount.net_balance;
        }
      }
    });

    // 3. Mathematical Formula Resolutions
    statement.summary.gross_profit =
      statement.summary.total_revenue - statement.summary.total_cogs;
    statement.summary.net_profit =
      statement.summary.gross_profit - statement.summary.total_opex;

    // 4. Immutable Audit Trail Logging
    await logSecureAction(
      activeUser.id,
      targetBranch,
      "VIEW_INCOME_STATEMENT",
      "INFO",
      ipAddress,
      "general_ledger",
      null,
      null,
      {
        start_date,
        end_date,
        branch,
        net_profit_generated: statement.summary.net_profit,
      },
    );

    return statement;
  }
}

module.exports = IncomeStatementService;
