const InventoryModel = require("../models/Inventory");

class InventoryService {
  // --- FROM ADMIN/MANAGER (Master Inventory) ---
  static async getAllItems() {
    const items = await InventoryModel.getAllInventoryItems();

    // Apply Visual Status Logic to the Master Enterprise view
    return items.map((item) => {
      // Math: Available for Sale = Total Physical - Total Reserved
      const availableQuantity =
        Number(item.total_physical_stock) - Number(item.total_reserved_stock);

      // Logic 1: Red vs Green Status
      let status = "HEALTHY";
      if (availableQuantity <= Number(item.reorder_level)) {
        status = "LOW_STOCK";
      }

      // Logic 2: The Blue "Reserved" Status
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
