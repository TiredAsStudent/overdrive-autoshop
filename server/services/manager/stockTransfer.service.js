const StockTransferModel = require("../../models/StockTransfer");
const { logSecureAction } = require("../../utils/auditLogger");

class StockTransferService {
  static async getTransfers(
    page = 1,
    limit = 10,
    search = "",
    sourceBranch = "all",
    destBranch = "all",
    category = "all",
    startDate = null,
    endDate = null,
  ) {
    const offset = (page - 1) * limit;
    const [totalItems, transfers] = await Promise.all([
      StockTransferModel.countFiltered(
        search,
        sourceBranch,
        destBranch,
        category,
        startDate,
        endDate,
      ),
      StockTransferModel.findPaginated(
        limit,
        offset,
        search,
        sourceBranch,
        destBranch,
        category,
        startDate,
        endDate,
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

  static async getTransferDetails(transferId) {
    const transfer = await StockTransferModel.findById(transferId);
    if (!transfer) throw new Error("Transfer manifest not found.");
    return transfer;
  }

  static async executeTransfer(data, adminUser, ipAddress) {
    const result = await StockTransferModel.executeTransfer(data, adminUser.id);

    await logSecureAction(
      adminUser.id,
      null,
      "EXECUTED_BULK_STOCK_TRANSFER",
      "WARNING",
      ipAddress,
      "stock_transfers",
      result.id,
      null,
      {
        source_branch_id: data.source_branch_id,
        destination_branch_id: data.destination_branch_id,
        total_items_moved: result.total_items,
        total_quantity_moved: result.total_quantity,
        total_asset_value_moved: parseFloat(result.total_asset_value),
        reference: result.transfer_reference,
      },
    );
    return result;
  }
}

module.exports = StockTransferService;
