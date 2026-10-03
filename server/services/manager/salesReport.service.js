const SalesReportModel = require("../../models/SalesReport");
const { logSecureAction } = require("../../utils/auditLogger");

class SalesReportService {
  static async generateReport(filters, page, limit, activeUser, ipAddress) {
    const offset = (page - 1) * limit;

    // 1. Parallel execution for high-speed reporting
    const [
      kpis,
      branchDistribution,
      serviceDistribution,
      topCustomers,
      paymentDistribution,
      { transactions, totalCount },
    ] = await Promise.all([
      SalesReportModel.getExecutiveKPIs(filters),
      SalesReportModel.getBranchDistribution(filters),
      SalesReportModel.getServiceDistribution(filters),
      SalesReportModel.getTopCustomers(filters),
      SalesReportModel.getPaymentStatusDistribution(filters),
      SalesReportModel.getPaginatedLedger(filters, limit, offset),
    ]);

    // 2. Parse and Format KPI Mathematical Values
    const totalNetRevenue = parseFloat(kpis.total_net_revenue);
    const serviceNetRevenue = parseFloat(kpis.service_net_revenue);
    const partsNetRevenue = parseFloat(kpis.parts_net_revenue);
    const totalInvoices = parseInt(kpis.total_invoices, 10);

    const averageSalesValue =
      totalInvoices > 0 ? totalNetRevenue / totalInvoices : 0;

    const formattedKpis = {
      total_sales_revenue: totalNetRevenue,
      service_revenue: {
        amount: serviceNetRevenue,
        percentage:
          totalNetRevenue > 0
            ? parseFloat(
                ((serviceNetRevenue / totalNetRevenue) * 100).toFixed(2),
              )
            : 0,
      },
      parts_revenue: {
        amount: partsNetRevenue,
        percentage:
          totalNetRevenue > 0
            ? parseFloat(((partsNetRevenue / totalNetRevenue) * 100).toFixed(2))
            : 0,
      },
      average_sales_value: averageSalesValue,
      total_invoices: totalInvoices,
    };

    // 3. Assemble Output Structure
    const report = {
      kpis: formattedKpis,
      distributions: {
        by_branch: branchDistribution.map((b) => ({
          ...b,
          net_revenue: parseFloat(b.net_revenue),
          transaction_count: parseInt(b.transaction_count, 10),
        })),
        by_service_category: serviceDistribution.map((s) => ({
          ...s,
          net_revenue: parseFloat(s.net_revenue),
          transaction_count: parseInt(s.transaction_count, 10),
        })),
        top_customers: topCustomers.map((c) => ({
          ...c,
          net_revenue: parseFloat(c.net_revenue),
          transaction_count: parseInt(c.transaction_count, 10),
        })),
        payment_status: paymentDistribution.map((p) => ({
          ...p,
          total_volume: parseFloat(p.total_volume),
          invoice_count: parseInt(p.invoice_count, 10),
        })),
      },
      transactions: transactions.map((t) => ({
        ...t,
        net_revenue: parseFloat(t.net_revenue),
        grand_total: parseFloat(t.grand_total),
        service_count: parseInt(t.service_count, 10),
        part_count: parseInt(t.part_count, 10),
      })),
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
      "VIEW_SALES_REPORT",
      "INFO",
      ipAddress,
      "general_ledger", // Logical group for analytics
      null,
      null,
      {
        filters: filters,
        total_revenue_accessed: totalNetRevenue,
        invoices_scanned: totalInvoices,
      },
    );

    return report;
  }
}

module.exports = SalesReportService;
