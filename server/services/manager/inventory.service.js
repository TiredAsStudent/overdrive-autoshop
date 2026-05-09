const Inventory = require("../../models/Inventory");
const Branch = require("../../models/Branch");
const { logSecureAction } = require("../../utils/auditLogger");

class InventoryService {
  static async createInventoryItem(data, managerId, ipAddress) {
    const cleanSku = data.sku.toUpperCase().trim();
    if (await Inventory.findBySku(cleanSku))
      throw new Error(`SKU '${cleanSku}' already exists.`);

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

  static async updateInventoryItem(id, data, managerId, ipAddress) {
    const oldItem = await Inventory.findById(id);
    if (!oldItem) throw new Error("Inventory item not found.");

    const updatedItem = await Inventory.update(id, data);

    const actionType =
      data.is_active === false
        ? "INVENTORY_ITEM_DEACTIVATED"
        : "INVENTORY_ITEM_UPDATED";
    await logSecureAction(
      managerId,
      null,
      actionType,
      "WARNING",
      ipAddress,
      "inventory_items",
      id,
      oldItem,
      updatedItem,
    );

    return updatedItem;
  }

  static async getStockOverview(branchId) {
    if (branchId) {
      if (!(await Branch.findById(branchId)))
        throw new Error("Branch not found.");
      return await Inventory.getBranchOverview(branchId);
    }
    return await Inventory.getConsolidatedOverview();
  }
}

module.exports = InventoryService;
