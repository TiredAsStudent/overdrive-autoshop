const VatLedger = require("../../models/VatLedger");
const Branch = require("../../models/Branch");
const { logSecureAction } = require("../../utils/auditLogger");

class VatService {
  static async getVatDashboard(taxPeriod, branchId) {
    // Determine the active period if none is provided (Current Month)
    const activePeriod = taxPeriod || new Date().toISOString().slice(0, 7);

    if (branchId) {
      const branchExists = await Branch.findById(branchId);
      if (!branchExists) throw new Error("Branch not found.");
    }

    // Run parallel queries for speed
    const [entries, summary] = await Promise.all([
      VatLedger.getLedgerEntries(activePeriod, branchId),
      VatLedger.getSummary(activePeriod, branchId),
    ]);

    return {
      period: activePeriod,
      summary: {
        total_output_vat: parseFloat(summary.total_output_vat),
        total_input_vat: parseFloat(summary.total_input_vat),
        net_vat_payable: parseFloat(summary.net_vat_payable),
        is_period_closed: summary.is_period_closed || false,
      },
      transactions: entries,
    };
  }

  static async closeTaxPeriod(taxPeriod, managerId, ipAddress) {
    const summary = await VatLedger.getSummary(taxPeriod, null);

    if (summary.is_period_closed) {
      throw new Error(
        `Tax period ${taxPeriod} is already closed and immutable.`,
      );
    }

    const closedRecords = await VatLedger.closeTaxPeriod(taxPeriod);

    if (closedRecords.length === 0) {
      throw new Error(
        "No active transactions found for this tax period to close.",
      );
    }

    // Audit Trail: Log this high-security action
    await logSecureAction(
      managerId,
      null, // Global action
      "TAX_PERIOD_CLOSED",
      "CRITICAL",
      ipAddress,
      "vat_ledger",
      null, // No single ID, affects multiple
      {
        period: taxPeriod,
        status: "OPEN",
        total_records_locked: closedRecords.length,
      },
      {
        period: taxPeriod,
        status: "CLOSED",
        net_vat_payable: summary.net_vat_payable,
      },
    );

    return {
      message: `Tax period ${taxPeriod} successfully closed and locked.`,
      records_locked: closedRecords.length,
    };
  }
}

module.exports = VatService;
