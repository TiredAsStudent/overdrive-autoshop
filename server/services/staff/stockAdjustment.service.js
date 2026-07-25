const StockAdjustmentModel = require("../../models/StockAdjustment");
const InventoryModel = require("../../models/Inventory");
const { logSecureAction } = require("../../utils/auditLogger");

class StaffStockAdjustmentService {
  static async createRequest(data, userId, branchId, ipAddress) {
    // 1. Verify Item Exists and grab real-time current stock
    const itemBreakdowns = await InventoryModel.getBranchBreakdown(
      data.item_id,
    );
    const branchStock = itemBreakdowns.find((b) => b.branch_id === branchId);

    if (!branchStock) {
      throw new Error(
        "Item is not configured or does not exist for your assigned branch.",
      );
    }

    const currentSystemQuantity = parseInt(branchStock.quantity, 10);
    const physicalCount = parseInt(data.physical_count, 10);

    // 2. Validate Variance (VR-04)
    const difference = physicalCount - currentSystemQuantity;
    if (difference === 0) {
      throw new Error(
        "Physical count matches system quantity exactly. No adjustment is required.",
      );
    }

    // 3. Prevent Duplicate Pending Requests (VR-06)
    const existingPending = await StockAdjustmentModel.checkPendingRequest(
      data.item_id,
      branchId,
    );
    if (existingPending) {
      throw new Error(
        "A pending adjustment request already exists for this item. Please wait for manager resolution.",
      );
    }

    // 4. Calculate Mathematical Payload
    const payload = {
      item_id: data.item_id,
      branch_id: branchId,
      requested_by: userId,
      current_system_quantity: currentSystemQuantity,
      physical_count: physicalCount,
      adjustment_type: difference > 0 ? "ADD" : "DEDUCT",
      quantity: Math.abs(difference),
      reason: data.reason,
      staff_remarks: data.staff_remarks,
    };

    // 5. Insert Record
    const newRequest = await StockAdjustmentModel.createRequest(payload);

    // 6. Log Immutable Audit Action
    await logSecureAction(
      userId,
      branchId,
      "SUBMITTED_STOCK_ADJUSTMENT_REQUEST",
      "INFO",
      ipAddress,
      "stock_adjustment_requests",
      newRequest.id,
      null,
      {
        adjustment_number: newRequest.adjustment_number,
        item_id: newRequest.item_id,
        variance: difference,
        reason: newRequest.reason,
      },
    );

    return newRequest;
  }

  static async getRequests(
    branchId,
    page = 1,
    limit = 10,
    search = "",
    status = "all",
  ) {
    const offset = (page - 1) * limit;

    // Leverage existing Manager model but force the branch constraint to lock it to the Staff's branch
    const [totalItems, requests] = await Promise.all([
      StockAdjustmentModel.countFiltered(search, status, branchId),
      StockAdjustmentModel.findPaginated(
        limit,
        offset,
        search,
        status,
        branchId,
      ),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      requests,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}

module.exports = StaffStockAdjustmentService;
