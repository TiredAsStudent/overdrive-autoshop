const StaffInventoryModel = require("../../models/staff/inventoryModel");

class StaffInventoryService {
  static async getLocalStock(branchId, searchTerm) {
    const items = await StaffInventoryModel.getLocalInventory(
      branchId,
      searchTerm,
    );

    // Apply the Visual Status Logic for the frontend
    return items.map((item) => {
      // Logic 1: Red vs Green
      let status = "HEALTHY"; // 🟢 Default Green

      // If the available stock is less than or equal to the reorder level, it's low.
      if (Number(item.available_quantity) <= Number(item.reorder_level)) {
        status = "LOW_STOCK"; // 🔴 Red
      }

      // Logic 2: The Blue "Reserved" Status
      // We pass this as a boolean flag. If true, the frontend will show a blue badge indicating WIP lock.
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
    return await StaffInventoryModel.getGlobalInventory(
      inventoryId,
      currentBranchId,
    );
  }
}

module.exports = StaffInventoryService;
