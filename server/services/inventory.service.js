const InventoryModel = require("../models/Inventory");
const { logSecureAction } = require("../utils/auditLogger");

class InventoryService {
  static async getAllItems() {
    const items = await InventoryModel.getAllInventoryItems();

    return items.map((item) => {
      const availableQuantity =
        Number(item.total_physical_stock) - Number(item.total_reserved_stock);

      let status = "HEALTHY";
      if (availableQuantity <= Number(item.reorder_level)) {
        status = "LOW_STOCK";
      }

      const hasReserved = Number(item.total_reserved_stock) > 0;

      return {
        ...item,
        available_quantity: availableQuantity,
        status,
        has_reserved: hasReserved,
      };
    });
  }

  static async createItem(data, userId, ipAddress) {
    const existing = await InventoryModel.checkItemCodeExists(data.item_code);
    if (existing) {
      throw new Error(
        `An item with SKU/Code '${data.item_code}' already exists.`,
      );
    }

    const newItem = await InventoryModel.createItem(data);

    await logSecureAction(
      userId,
      null,
      "INVENTORY_ITEM_CREATED",
      "INFO",
      ipAddress,
      "inventory",
      newItem.id,
      null,
      data,
    );

    return newItem;
  }

  static async updateItem(id, data, userId, ipAddress) {
    if (data.item_code) {
      const existing = await InventoryModel.checkItemCodeExists(data.item_code);
      if (existing && existing.id !== parseInt(id)) {
        throw new Error("This SKU/Code is already assigned to another item.");
      }
    }

    const updatedItem = await InventoryModel.updateItem(id, data);

    await logSecureAction(
      userId,
      null,
      "INVENTORY_ITEM_UPDATED",
      "WARNING",
      ipAddress,
      "inventory",
      id,
      null, // Add a findById to your model later if you want strict Deltas here
      data,
    );

    return updatedItem;
  }

  static async getLocalStock(branchId, searchTerm) {
    const items = await InventoryModel.getLocalInventory(branchId, searchTerm);

    return items.map((item) => {
      let status = "HEALTHY";
      if (Number(item.available_quantity) <= Number(item.reorder_level)) {
        status = "LOW_STOCK";
      }
      const hasReserved = Number(item.reserved_quantity) > 0;

      return {
        ...item,
        status,
        has_reserved: hasReserved,
      };
    });
  }

  static async getOtherBranchesStock(inventoryId, currentBranchId) {
    if (!inventoryId)
      throw new Error("Inventory ID is required to perform a global search.");
    return await InventoryModel.getGlobalInventory(
      inventoryId,
      currentBranchId,
    );
  }
}

module.exports = InventoryService;
