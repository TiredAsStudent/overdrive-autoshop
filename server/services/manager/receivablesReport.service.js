const ReceivablesReportModel = require("../../models/ReceivablesReport");
const { logSecureAction } = require("../../utils/auditLogger");

class ReceivablesReportService {
  static async generateReport(filters, page, limit, activeUser, ipAddress) {
    const offset = (page - 1) * limit;

    // 1. Parallel execution for high-performance reporting
    const [kpis, agingDist, { ledger, totalCount }] = await Promise.all([
      ReceivablesReportModel.getExecutiveKPIs(filters),
      ReceivablesReportModel.getAgingDistribution(filters),
      ReceivablesReportModel.getPaginatedLedger(filters, limit, offset),
    ]);

    // 2. Parse & Format Metrics
    const totalOutstanding = parseFloat(kpis.total_outstanding);
    const totalOverdue = parseFloat(kpis.total_overdue);

    // 3. Assemble Output Structure
    const report = {
      kpis: {
        total_outstanding: totalOutstanding,
        total_overdue: totalOverdue,
        open_invoices_count: parseInt(kpis.open_invoices_count, 10),
        high_risk_overdue: parseFloat(kpis.high_risk_overdue),
      },
      aging_distribution: {
        current_balance: parseFloat(agingDist.current_balance),
        days_1_30: parseFloat(agingDist.days_1_30),
        days_31_60: parseFloat(agingDist.days_31_60),
        days_61_90: parseFloat(agingDist.days_61_90),
        days_over_90: parseFloat(agingDist.days_over_90),
      },
      ledger: ledger.map((t) => ({
        ...t,
        invoice_amount: parseFloat(t.invoice_amount),
        amount_paid: parseFloat(t.amount_paid),
        outstanding_balance: parseFloat(t.outstanding_balance),
        days_overdue: parseInt(t.days_overdue, 10),
      })),
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };

    // 4. Immutable Audit Trail Logging
    const targetBranch =
      filters.branch === "all" ? null : parseInt(filters.branch, 10);
    await logSecureAction(
      activeUser.id,
      targetBranch,
      "VIEW_RECEIVABLES_REPORT",
      "INFO",
      ipAddress,
      "general_ledger", // Logical mapping to financial reports
      null,
      null,
      {
        filters: filters,
        total_outstanding_accessed: totalOutstanding,
      },
    );

    return report;
  }

  static async getCustomerDetails(customerId, activeUser, ipAddress) {
    const details =
      await ReceivablesReportModel.getCustomerReceivableDetails(customerId);

    if (!details) {
      throw new Error(
        "Customer profile not found or holds no receivable records.",
      );
    }

    await logSecureAction(
      activeUser.id,
      null,
      "VIEW_CUSTOMER_RECEIVABLES_DETAILS",
      "INFO",
      ipAddress,
      "customers",
      customerId,
      null,
      null,
    );

    return details;
  }
}

module.exports = ReceivablesReportService;
