const ExpenseModel = require("../../models/Expense");
const { logSecureAction } = require("../../utils/auditLogger");

class ReceiptApprovalService {
  static async getPendingApprovals(
    page = 1,
    limit = 10,
    search = "",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, receipts] = await Promise.all([
      ExpenseModel.countReceiptApprovals(search, "PENDING_APPROVAL", branchId),
      ExpenseModel.findPaginatedReceiptApprovals(
        limit,
        offset,
        search,
        "PENDING_APPROVAL",
        branchId,
      ),
    ]);

    return {
      receipts,
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
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, receipts] = await Promise.all([
      ExpenseModel.countReceiptApprovalHistory(search, branchId),
      ExpenseModel.findPaginatedReceiptApprovalHistory(
        limit,
        offset,
        search,
        branchId,
      ),
    ]);

    return {
      receipts,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async getReceiptDetails(id) {
    const receipt = await ExpenseModel.findReceiptApprovalById(id);
    if (!receipt) throw new Error("Receipt record not found.");

    return receipt;
  }

  static async _executeDecision(
    id,
    actionStatus,
    remarks,
    activeUser,
    ipAddress,
  ) {
    const receipt = await ExpenseModel.findReceiptApprovalById(id);
    if (!receipt) throw new Error("Receipt record not found.");

    const updatedReceipt = await ExpenseModel.processApprovalDecision(
      id,
      actionStatus,
      remarks || null,
      activeUser.id,
    );

    if (!updatedReceipt) {
      throw new Error(
        `Conflict: This Receipt is no longer pending. It may have been processed by another manager.`,
      );
    }

    const actionName =
      actionStatus === "APPROVED" ? "RECEIPT_APPROVED" : "RECEIPT_REJECTED";
    const severity = actionStatus === "APPROVED" ? "INFO" : "WARNING";

    await logSecureAction(
      activeUser.id,
      receipt.branch_id,
      actionName,
      severity,
      ipAddress,
      "expenses",
      id,
      { status: receipt.status },
      { status: actionStatus, remarks },
    );

    return updatedReceipt;
  }

  static async approveReceipt(id, remarks, activeUser, ipAddress) {
    return await this._executeDecision(
      id,
      "APPROVED",
      remarks,
      activeUser,
      ipAddress,
    );
  }

  static async rejectReceipt(id, remarks, activeUser, ipAddress) {
    return await this._executeDecision(
      id,
      "REJECTED",
      remarks,
      activeUser,
      ipAddress,
    );
  }
}

module.exports = ReceiptApprovalService;
