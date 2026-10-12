const TaxVatReportModel = require("../../models/TaxVatReport");
const { logSecureAction } = require("../../utils/auditLogger");

class TaxVatReportService {
  static async generateReport(filters, page, limit, activeUser, ipAddress) {
    const offset = (page - 1) * limit;

    const [kpis, moduleSummary, systemVatRate, { transactions, totalCount }] =
      await Promise.all([
        TaxVatReportModel.getExecutiveKPIs(filters),
        TaxVatReportModel.getVATSummaryByModule(filters),
        TaxVatReportModel.getSystemVatRate(),
        TaxVatReportModel.getPaginatedLedger(filters, limit, offset),
      ]);

    const totalTaxableSales = parseFloat(kpis.total_taxable_sales);
    const totalOutputVat = parseFloat(kpis.total_output_vat);
    const totalTaxablePurchases = parseFloat(kpis.total_taxable_purchases);
    const totalInputVat = parseFloat(kpis.total_input_vat);

    // Equation: Net VAT = Output VAT - Input VAT
    const netVatPosition = totalOutputVat - totalInputVat;

    let positionStatus = "NET_VAT_ZERO";
    if (netVatPosition > 0) positionStatus = "NET_VAT_PAYABLE";
    else if (netVatPosition < 0) positionStatus = "NET_VAT_CREDIT";

    const formattedKpis = {
      system_vat_rate: parseFloat(systemVatRate),
      total_taxable_sales: totalTaxableSales,
      total_output_vat: totalOutputVat,
      total_taxable_purchases: totalTaxablePurchases,
      total_input_vat: totalInputVat,
      net_vat_position: Math.abs(netVatPosition),
      position_status: positionStatus,
    };

    const report = {
      kpis: formattedKpis,
      distributions: {
        by_module: moduleSummary.map((m) => ({
          source_module: m.source_module,
          vat_type: m.vat_type,
          transaction_count: parseInt(m.transaction_count, 10),
          total_taxable_base: parseFloat(m.total_taxable_base),
          total_vat: parseFloat(m.total_vat),
        })),
      },
      transactions: transactions.map((t) => ({
        ...t,
        taxable_base: parseFloat(t.taxable_base),
        vat_amount: parseFloat(t.vat_amount),
      })),
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };

    const targetBranch =
      filters.branch === "all" ? null : parseInt(filters.branch, 10);
    await logSecureAction(
      activeUser.id,
      targetBranch,
      "VIEW_TAX_VAT_REPORT",
      "INFO",
      ipAddress,
      "general_ledger",
      null,
      null,
      {
        filters: filters,
        net_vat_position: Math.abs(netVatPosition),
        position_status: positionStatus,
      },
    );

    return report;
  }
}

module.exports = TaxVatReportService;
