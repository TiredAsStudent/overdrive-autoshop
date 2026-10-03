const CashFlowStatementModel = require("../../models/CashFlowStatement");
const { logSecureAction } = require("../../utils/auditLogger");

class CashFlowStatementService {
  static async generateCashFlowStatement(filters, activeUser, ipAddress) {
    const { branch, start_date, end_date, hide_zero } = filters;
    const targetBranch = branch === "all" ? null : parseInt(branch, 10);

    // 1. Retrieve the FRS Data via Postgres Engine
    const { opening_balance, transactions } =
      await CashFlowStatementModel.getCashFlowData(
        targetBranch,
        start_date,
        end_date,
      );

    // 2. Aggregate Data into IFRS Standard Categories
    const aggregated = {
      OPERATING: {},
      INVESTING: {},
      FINANCING: {},
    };

    transactions.forEach((t) => {
      const type = t.activity_type;
      const desc = t.description;
      const amount = parseFloat(t.net_amount);

      if (!aggregated[type][desc]) aggregated[type][desc] = 0;
      aggregated[type][desc] += amount;
    });

    // 3. Format Array Output & Calculate Subtotals
    const formatSection = (type) => {
      let net = 0;
      const lines = Object.entries(aggregated[type]).map(
        ([description, net_balance]) => {
          net += net_balance;
          return { description, net_balance };
        },
      );
      return {
        lines:
          hide_zero === "true"
            ? lines.filter((l) => l.net_balance !== 0)
            : lines,
        net,
      };
    };

    const operating = formatSection("OPERATING");
    const investing = formatSection("INVESTING");
    const financing = formatSection("FINANCING");

    const netChangeInCash = operating.net + investing.net + financing.net;
    const endingBalance = opening_balance + netChangeInCash;

    const statement = {
      opening_balance,
      operating_activities: operating.lines,
      investing_activities: investing.lines,
      financing_activities: financing.lines,
      summary: {
        net_operating: operating.net,
        net_investing: investing.net,
        net_financing: financing.net,
        net_change_in_cash: netChangeInCash,
        ending_balance,
      },
    };

    // 4. Immutable Audit Trail Integration
    await logSecureAction(
      activeUser.id,
      targetBranch,
      "VIEW_CASH_FLOW_STATEMENT",
      "INFO",
      ipAddress,
      "general_ledger", // Logical grouping for financial reports
      null,
      null,
      {
        start_date,
        end_date,
        branch,
        ending_liquidity: endingBalance,
      },
    );

    return statement;
  }
}

module.exports = CashFlowStatementService;
