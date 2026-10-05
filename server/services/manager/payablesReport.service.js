const PayablesReportModel = require("../../models/PayablesReport");
const { logSecureAction } = require("../../utils/auditLogger");

class PayablesReportService {
  static async generateReport(filters, page, limit, activeUser, ipAddress) {
    const offset = (page - 1) * limit;

    // 1. Parallel execution for high-performance AP reporting
    const [kpis, agingDist, { ledger, totalCount }] = await Promise.all([
      PayablesReportModel.getExecutiveKPIs(filters),
      PayablesReportModel.getAgingDistribution(filters),
      PayablesReportModel.getPaginatedLedger(filters, limit, offset),
    ]);

    // 2. Parse & Format Metrics
    const totalOutstanding = parseFloat(kpis.total_outstanding);
    const totalOverdue = parseFloat(kpis.total_overdue);

    // 3. Assemble Output Structure
    const report = {
      kpis: {
        total_outstanding: totalOutstanding,
        total_overdue: totalOverdue,
        open_bills_count: parseInt(kpis.open_bills_count, 10),
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
        bill_amount: parseFloat(t.bill_amount),
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
      "VIEW_PAYABLES_REPORT",
      "INFO",
      ipAddress,
      "general_ledger", // Logical mapping to financial liabilities
      null,
      null,
      {
        filters: filters,
        total_outstanding_accessed: totalOutstanding,
      },
    );

    return report;
  }

  static async getVendorDetails(vendorId, activeUser, ipAddress) {
    const details = await PayablesReportModel.getVendorPayableDetails(vendorId);

    if (!details) {
      throw new Error("Vendor profile not found or holds no payable records.");
    }

    await logSecureAction(
      activeUser.id,
      null,
      "VIEW_VENDOR_PAYABLES_DETAILS",
      "INFO",
      ipAddress,
      "vendors",
      vendorId,
      null,
      null,
    );

    return details;
  }
}

module.exports = PayablesReportService;
