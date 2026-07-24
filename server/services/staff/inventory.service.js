const InventoryModel = require("../../models/Inventory");
const BranchModel = require("../../models/Branch");

class StaffInventoryService {
  /**
   * Retrieves paginated, branch-isolated inventory.
   * Forces system status to "active" so staff only sees operational items.
   */
  static async getBranchInventory(
    branchId,
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    stockStatus = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, items] = await Promise.all([
      InventoryModel.countFilteredItems(
        search,
        category,
        branchId,
        "active", // Force active items only
        stockStatus,
      ),
      InventoryModel.findPaginatedItems(
        limit,
        offset,
        search,
        category,
        branchId,
        "active", // Force active items only
        stockStatus,
      ),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Retrieves specific item details safely scoped to the Staff's branch.
   */
  static async getItemDetails(itemId, branchId) {
    const item = await InventoryModel.findById(itemId);
    if (!item) throw new Error("Inventory item not found.");
    if (!item.is_active)
      throw new Error("This inventory item is currently archived.");

    // Extract branch stock specific to the authenticated user's branch
    const breakdowns = await InventoryModel.getBranchBreakdown(itemId);
    const branchStock = breakdowns.find((b) => b.branch_id === branchId);

    if (!branchStock)
      throw new Error("Item is not configured for this branch.");

    return {
      ...item,
      branch_stock: branchStock,
    };
  }

  /**
   * Retrieves movement history, strictly filtering out transactions from other branches.
   */
  static async getItemMovementHistory(itemId, branchId) {
    // 1. Get the branch name to match against the global ledger
    const branch = await BranchModel.findById(branchId);
    if (!branch) throw new Error("Branch configuration error.");

    // 2. Fetch the global history (Reusing your optimized model)
    const globalHistory = await InventoryModel.getMovementHistory(itemId);

    // 3. BR-02 Compliance: Filter out any movements that did not occur in this branch
    const branchHistory = globalHistory.filter(
      (movement) => movement.branch_name === branch.branch_name,
    );

    return branchHistory;
  }
}

module.exports = StaffInventoryService;
