const StockAdjustmentModel = require("../../models/StockAdjustment");
const { logSecureAction } = require("../../utils/auditLogger");

class StockAdjustmentService {
  static async getRequests(
    page = 1,
    limit = 10,
    search = "",
    status = "PENDING",
    branch = "all",
  ) {
    const offset = (page - 1) * limit;
    const [totalItems, requests] = await Promise.all([
      StockAdjustmentModel.countFiltered(search, status, branch),
      StockAdjustmentModel.findPaginated(limit, offset, search, status, branch),
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

  static async approve(requestId, adminUser, ipAddress, managerRemarks) {
    const result = await StockAdjustmentModel.approveTransaction(
      requestId,
      adminUser.id,
      managerRemarks,
    );

    await logSecureAction(
      adminUser.id,
      result.branch_id,
      "APPROVED_STOCK_ADJUSTMENT",
      "WARNING",
      ipAddress,
      "stock_adjustment_requests",
      requestId,
      { status: "PENDING" },
      { status: "APPROVED", remarks: managerRemarks },
    );
    return result;
  }

  static async reject(requestId, adminUser, ipAddress, managerRemarks) {
    const result = await StockAdjustmentModel.rejectRequest(
      requestId,
      adminUser.id,
      managerRemarks,
    );

    await logSecureAction(
      adminUser.id,
      result.branch_id,
      "REJECTED_STOCK_ADJUSTMENT",
      "INFO",
      ipAddress,
      "stock_adjustment_requests",
      requestId,
      { status: "PENDING" },
      { status: "REJECTED", remarks: managerRemarks },
    );
    return result;
  }
}

module.exports = StockAdjustmentService;
