const Inventory = require("../../models/Inventory");
const Branch = require("../../models/Branch");
const { logSecureAction } = require("../../utils/auditLogger");

class InventoryService {
  static async createInventoryItem(data, managerId, ipAddress) {
    const cleanSku = data.sku.toUpperCase().trim();
    const existing = await Inventory.findBySku(cleanSku);
    if (existing)
      throw new Error(
        `SKU '${cleanSku}' already exists in the master catalog.`,
      );

    // Fetch active branches so the new item is trackable everywhere immediately
    const activeBranches = await Branch.findActive();

    const newItem = await Inventory.createItem(
      { ...data, sku: cleanSku },
      activeBranches,
    );

    await logSecureAction(
      managerId,
      null,
      "INVENTORY_ITEM_CREATED",
      "INFO",
      ipAddress,
      "inventory_items",
      newItem.id,
      null,
      newItem,
    );

    return newItem;
  }

  static async getStockOverview(branchId) {
    if (branchId) {
      const branch = await Branch.findById(branchId);
      if (!branch) throw new Error("Branch not found.");
      return await Inventory.getBranchOverview(branchId);
    }
    // If no branch is specified, return the entire company's consolidated stock
    return await Inventory.getConsolidatedOverview();
  }
}

module.exports = InventoryService;
