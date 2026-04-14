const InventoryModel = require("../../models/inventory/inventoryModel");

class InventoryLogic {
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
}

module.exports = InventoryLogic;
