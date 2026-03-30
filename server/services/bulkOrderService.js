const BulkOrderModel = require("../models/bulkOrderModel");

class BulkOrderService {
  static async getConsolidatedShoppingList() {
    const rawList = await BulkOrderModel.generateShoppingList();

    let grandTotalCost = 0;

    // Format the numbers properly and calculate the master total
    const shoppingList = rawList.map((item) => {
      const costForThisPart = Number(item.estimated_total_cost);
      grandTotalCost += costForThisPart;

      return {
        masterPartId: item.master_part_id,
        partName: item.part_name,
        supplierName: item.supplier_name || "Unknown Supplier",
        unitCost: Number(item.unit_cost),
        quantityToOrder: Number(item.total_quantity_to_order),
        estimatedCost: costForThisPart,
      };
    });

    return {
      totalItemsToOrder: shoppingList.length,
      grandTotalEstimatedCost: grandTotalCost,
      items: shoppingList,
    };
  }
}

module.exports = BulkOrderService;
