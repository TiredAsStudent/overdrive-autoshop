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
      ExpenseModel.countReceiptApprovals(search, null, branchId).then(
        (count) => {
          return ExpenseModel.pool
            .query(
              `SELECT COUNT(DISTINCT e.id) FROM expenses e WHERE e.scan_id IS NOT NULL AND e.status IN ('APPROVED', 'REJECTED') ${
                search
                  ? `AND (e.expense_number ILIKE '%${search}%' OR e.vendor_name ILIKE '%${search}%')`
                  : ""
              } ${branchId !== "all" ? `AND e.branch_id = ${branchId}` : ""}`,
            )
            .then((res) => parseInt(res.rows[0].count, 10));
        },
      ),
      ExpenseModel.pool
        .query(
          `SELECT e.id, e.expense_number, e.expense_date, e.category, e.total_amount, e.status, e.vendor_name, e.resolved_at as processed_at,
                b.branch_name, rs.confidence_score, u.first_name as resolved_by_name
         FROM expenses e
         JOIN branches b ON e.branch_id = b.id
         JOIN receipt_scans rs ON e.scan_id = rs.id
         LEFT JOIN users u ON e.resolved_by = u.id
         WHERE e.scan_id IS NOT NULL AND e.status IN ('APPROVED', 'REJECTED')
         ${search ? `AND (e.expense_number ILIKE '%${search}%' OR e.vendor_name ILIKE '%${search}%')` : ""}
         ${branchId !== "all" ? `AND e.branch_id = ${branchId}` : ""}
         ORDER BY e.resolved_at DESC LIMIT $1 OFFSET $2`,
          [limit, offset],
        )
        .then((res) => res.rows),
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
