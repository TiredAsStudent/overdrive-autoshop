const InventoryModel = require("../models/Inventory");

class InventoryService {
  // --- FROM ADMIN/MANAGER (Master Inventory) ---
  static async getAllItems() {
    return await InventoryModel.getAllInventoryItems();
  }

  static async createItem(data, userId, ipAddress) {
    const existing = await InventoryModel.checkItemCodeExists(data.item_code);
    if (existing) {
      throw new Error(
        `An item with SKU/Code '${data.item_code}' already exists.`,
      );
    }
    return await InventoryModel.createItemAndLogAudit(data, userId, ipAddress);
  }

  static async updateItem(id, data, userId, ipAddress) {
    if (data.item_code) {
      const existing = await InventoryModel.checkItemCodeExists(data.item_code);
      if (existing && existing.id !== parseInt(id)) {
        throw new Error("This SKU/Code is already assigned to another item.");
      }
    }
    return await InventoryModel.updateItem(id, data, userId, ipAddress);
  }

  // --- FROM STAFF (Local Stock Tracking) ---
  static async getLocalStock(branchId, searchTerm) {
    const items = await InventoryModel.getLocalInventory(branchId, searchTerm);

    // Apply the Visual Status Logic for the frontend
    return items.map((item) => {
      // Logic 1: Red vs Green
      let status = "HEALTHY"; // 🟢 Default Green

      // If the available stock is less than or equal to the reorder level, it's low.
      if (Number(item.available_quantity) <= Number(item.reorder_level)) {
        status = "LOW_STOCK"; // 🔴 Red
      }

      // Logic 2: The Blue "Reserved" Status
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
