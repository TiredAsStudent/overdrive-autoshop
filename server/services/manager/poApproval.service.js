const PurchaseOrderModel = require("../../models/PurchaseOrder");
const { logSecureAction } = require("../../utils/auditLogger");

class POApprovalService {
  static async getPendingApprovals(
    page = 1,
    limit = 10,
    search = "",
    vendorId = "all",
    branchId,
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, purchaseOrders] = await Promise.all([
      PurchaseOrderModel.countFiltered(
        search,
        "PENDING_APPROVAL",
        vendorId,
        branchId,
      ),
      PurchaseOrderModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        "PENDING_APPROVAL",
        vendorId,
        branchId,
      ),
    ]);

    return {
      purchaseOrders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async getApprovalHistory(
    page = 1,
    limit = 10,
    search = "",
    vendorId = "all",
    branchId,
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, purchaseOrders] = await Promise.all([
      PurchaseOrderModel.countApprovalHistory(search, vendorId, branchId),
      PurchaseOrderModel.findPaginatedApprovalHistory(
        limit,
        offset,
        search,
        vendorId,
        branchId,
      ),
    ]);

    return {
      purchaseOrders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async getPODetails(id) {
    const po = await PurchaseOrderModel.findById(id);
    if (!po) throw new Error("Purchase Order not found.");

    return po;
  }

  static async _executeDecision(
    id,
    actionStatus,
    remarks,
    activeUser,
    ipAddress,
  ) {
    const po = await PurchaseOrderModel.findById(id);
    if (!po) throw new Error("Purchase Order not found.");

    const updatedPO = await PurchaseOrderModel.processApprovalDecision(
      id,
      actionStatus,
      remarks || null,
      activeUser,
    );

    if (!updatedPO) {
      throw new Error(
        `Conflict: This Purchase Order is no longer pending. It may have been modified or processed by another manager.`,
      );
    }

    const actionName =
      actionStatus === "APPROVED" ? "PO_APPROVED" : "PO_REJECTED";
    const severity = actionStatus === "APPROVED" ? "INFO" : "WARNING";

    await logSecureAction(
      activeUser.id,
      po.branch_id,
      actionName,
      severity,
      ipAddress,
      "purchase_orders",
      id,
      { status: po.status },
      { status: actionStatus, remarks: updatedPO.approval_remarks },
    );

    return updatedPO;
  }

  static async approvePO(id, remarks, activeUser, ipAddress) {
    return await this._executeDecision(
      id,
      "APPROVED",
      remarks,
      activeUser,
      ipAddress,
    );
  }

  static async rejectPO(id, remarks, activeUser, ipAddress) {
    return await this._executeDecision(
      id,
      "REJECTED",
      remarks,
      activeUser,
      ipAddress,
    );
  }
}

module.exports = POApprovalService;
