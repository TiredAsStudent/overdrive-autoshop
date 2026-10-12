const InventoryReportModel = require("../../models/InventoryReport");
const { logSecureAction } = require("../../utils/auditLogger");

class InventoryReportService {
  static async generateReport(filters, page, limit, activeUser, ipAddress) {
    const offset = (page - 1) * limit;

    // 1. Concurrent Execution for High-Performance Analytics
    const [
      kpis,
      branchDistribution,
      movementVelocity,
      lowStockCount,
      { items, totalCount },
    ] = await Promise.all([
      InventoryReportModel.getExecutiveKPIs(filters),
      InventoryReportModel.getBranchDistribution(filters),
      InventoryReportModel.getMovementVelocity(filters),
      InventoryReportModel.getLowStockCount(filters),
      InventoryReportModel.getPaginatedLedger(filters, limit, offset),
    ]);

    // 2. Parse KPI Data
    const totalAssetValue = parseFloat(kpis.total_asset_value);
    const totalPhysicalUnits = parseInt(kpis.total_physical_units, 10);
    const totalTrackedItems = parseInt(kpis.total_items_tracked, 10);

    // 3. Assemble Final Output Structure
    const report = {
      kpis: {
        total_asset_value: totalAssetValue,
        total_physical_units: totalPhysicalUnits,
        total_tracked_items: totalTrackedItems,
        low_stock_count: lowStockCount,
      },
      distributions: {
        by_branch: branchDistribution.map((b) => ({
          branch_id: b.branch_id,
          branch_name: b.branch_name,
          active_skus: parseInt(b.active_skus, 10),
          total_units: parseInt(b.total_units, 10),
          asset_value: parseFloat(b.asset_value),
          value_percentage:
            totalAssetValue > 0
              ? parseFloat(
                  ((parseFloat(b.asset_value) / totalAssetValue) * 100).toFixed(
                    2,
                  ),
                )
              : 0,
        })),
        movements: {
          stock_received: parseInt(movementVelocity.stock_received, 10),
          stock_issued: parseInt(movementVelocity.stock_issued, 10),
          stock_adjustments_net: parseInt(
            movementVelocity.stock_adjustments_net,
            10,
          ),
          stock_transferred_in: parseInt(
            movementVelocity.stock_transferred_in,
            10,
          ),
          stock_transferred_out: parseInt(
            movementVelocity.stock_transferred_out,
            10,
          ),
        },
      },

      ledger: items.map((i) => ({
        ...i,
        unit_cost: parseFloat(i.unit_cost),
        total_valuation: parseFloat(i.total_valuation),
        quantity: parseInt(i.quantity, 10),
        reorder_point: parseInt(i.reorder_point, 10),
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
      "VIEW_INVENTORY_REPORT",
      "INFO",
      ipAddress,
      "general_ledger",
      null,
      null,
      {
        filters: filters,
        total_asset_value_accessed: totalAssetValue,
        total_units_scanned: totalPhysicalUnits,
      },
    );

    return report;
  }
}

module.exports = InventoryReportService;
