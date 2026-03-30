const BulkOrderService = require("../services/bulkOrderService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

class BulkOrderController {
  static async generateBulkOrder(req, res) {
    try {
      const list = await BulkOrderService.getConsolidatedShoppingList();
      return sendSuccess(
        res,
        200,
        list,
        "Consolidated Bulk Shopping List generated successfully.",
      );
    } catch (error) {
      console.error("Bulk Order Error:", error);
      return sendError(res, 500, "Failed to generate the bulk order list.");
    }
  }
}

module.exports = BulkOrderController;
