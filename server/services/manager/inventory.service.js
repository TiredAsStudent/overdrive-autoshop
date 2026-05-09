const Inventory = require("../../models/Inventory");
const Branch = require("../../models/Branch");
const { logSecureAction } = require("../../utils/auditLogger");

class InventoryService {
  static async getSystemMarkup() {
    return await Inventory.getSystemMarkup();
  }

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

    let actionType = "INVENTORY_ITEM_UPDATED";
    let severity = "WARNING";

    if (data.is_active === false) {
      actionType = "INVENTORY_ITEM_ARCHIVED";
      severity = "CRITICAL";
    } else if (data.is_active === true && oldItem.is_active === false) {
      actionType = "INVENTORY_ITEM_RESTORED";
    }

    await logSecureAction(
      managerId,
      null,
      actionType,
      severity,
      ipAddress,
      "inventory_items",
      id,
      oldItem,
      updatedItem,
    );
    return updatedItem;
  }

  static async getStockOverview(branchId, showArchived) {
    if (branchId) {
      if (!(await Branch.findById(branchId)))
        throw new Error("Branch not found.");
      return await Inventory.getBranchOverview(branchId, showArchived);
    }
    return await Inventory.getConsolidatedOverview(showArchived);
  }
}

module.exports = InventoryService;
