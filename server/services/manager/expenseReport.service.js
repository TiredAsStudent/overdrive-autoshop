const ExpenseReportModel = require("../../models/ExpenseReport");
const { logSecureAction } = require("../../utils/auditLogger");

class ExpenseReportService {
  static async generateReport(filters, page, limit, activeUser, ipAddress) {
    const offset = (page - 1) * limit;

    // 1. Parallel execution for massive FRS queries
    const [categorySummaries, { transactions, totalCount }] = await Promise.all(
      [
        ExpenseReportModel.getCategorySummaries(filters),
        ExpenseReportModel.getPaginatedTransactions(filters, limit, offset),
      ],
    );

    // 2. Compute Executive KPIs & Percentage Shares
    let grandTotalExpense = 0;
    let totalTransactionCount = 0;
    let topCategory = null;

    categorySummaries.forEach((cat) => {
      const amount = parseFloat(cat.total_amount);
      const count = parseInt(cat.transaction_count, 10);

      grandTotalExpense += amount;
      totalTransactionCount += count;

      if (!topCategory || amount > parseFloat(topCategory.total_amount)) {
        topCategory = { ...cat };
      }
    });

    const formattedSummaries = categorySummaries.map((cat) => {
      const amount = parseFloat(cat.total_amount);
      const percentage =
        grandTotalExpense > 0
          ? ((amount / grandTotalExpense) * 100).toFixed(2)
          : "0.00";

      return {
        ...cat,
        total_amount: amount,
        percentage_of_total: parseFloat(percentage),
      };
    });

    // 3. Assemble Output Structure
    const report = {
      kpis: {
        total_operating_expense: grandTotalExpense,
        total_transaction_count: totalTransactionCount,
        average_expense_size:
          totalTransactionCount > 0
            ? grandTotalExpense / totalTransactionCount
            : 0,
        top_category: topCategory
          ? {
              name: topCategory.category_name,
              amount: parseFloat(topCategory.total_amount),
              percentage: parseFloat(
                (
                  (parseFloat(topCategory.total_amount) / grandTotalExpense) *
                  100
                ).toFixed(2),
              ),
            }
          : null,
      },
      category_summary: formattedSummaries,
      transactions: transactions,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };

    // 4. Immutable Audit Trail Integration
    const targetBranch =
      filters.branch === "all" ? null : parseInt(filters.branch, 10);
    await logSecureAction(
      activeUser.id,
      targetBranch,
      "VIEW_EXPENSE_REPORT",
      "INFO",
      ipAddress,
      "general_ledger",
      null,
      null,
      {
        filters: filters,
        total_operating_expense: grandTotalExpense,
        total_transaction_count: totalTransactionCount,
      },
    );

    return report;
  }
}

module.exports = ExpenseReportService;
