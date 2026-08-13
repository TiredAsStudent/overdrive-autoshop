const StockAdjustmentModel = require("../../models/StockAdjustment");
const InventoryModel = require("../../models/Inventory");
const { logSecureAction } = require("../../utils/auditLogger");

class StaffStockAdjustmentService {
  static async createRequest(data, userId, branchId, ipAddress) {
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

    const difference = physicalCount - currentSystemQuantity;
    if (difference === 0) {
      throw new Error(
        "Physical count matches system quantity exactly. No adjustment is required.",
      );
    }

    const existingPending = await StockAdjustmentModel.checkPendingRequest(
      data.item_id,
      branchId,
    );
    if (existingPending) {
      throw new Error(
        "A pending adjustment request already exists for this item. Please wait for manager resolution.",
      );
    }

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
      evidence_url: data.evidence_url || null,
    };

    const newRequest = await StockAdjustmentModel.createRequest(payload);

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
        has_evidence: !!payload.evidence_url,
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
