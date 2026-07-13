const StockTransferModel = require("../../models/StockTransfer");
const { logSecureAction } = require("../../utils/auditLogger");

class StockTransferService {
  static async getTransfers(
    page = 1,
    limit = 10,
    search = "",
    sourceBranch = "all",
    destBranch = "all",
  ) {
    const offset = (page - 1) * limit;
    const [totalItems, transfers] = await Promise.all([
      StockTransferModel.countFiltered(search, sourceBranch, destBranch),
      StockTransferModel.findPaginated(
        limit,
        offset,
        search,
        sourceBranch,
        destBranch,
      ),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    return {
      transfers,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async executeTransfer(data, adminUser, ipAddress) {
    const result = await StockTransferModel.executeTransfer(data, adminUser.id);

    // Calculate the Financial Valuation Impact for the Audit Log
    const financialImpact = data.quantity * result.recorded_unit_cost;

    await logSecureAction(
      adminUser.id,
      null, // Global action because it spans two branches
      "EXECUTED_STOCK_TRANSFER",
      "WARNING", // Flagged as warning because it shifts physical assets structurally
      ipAddress,
      "stock_transfers",
      result.id,
      null,
      {
        source_branch_id: data.source_branch_id,
        destination_branch_id: data.destination_branch_id,
        item_id: data.item_id,
        quantity_moved: data.quantity,
        asset_value_moved: financialImpact,
        reference: result.transfer_reference,
      },
    );
    return result;
  }
}

module.exports = StockTransferService;
