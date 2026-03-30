const ExpenseService = require("../services/expenseService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

class ExpenseController {
  static async getCategories(req, res) {
    try {
      const categories = await ExpenseService.getCategories();
      return sendSuccess(
        res,
        200,
        categories,
        "Fetched COA categories successfully.",
      );
    } catch (error) {
      return sendError(res, 500, "Failed to fetch categories.");
    }
  }

  // Grease-Proof Upload -> OCR Extraction
  static async extractOcrData(req, res) {
    try {
      if (!req.file)
        return sendError(res, 400, "Please upload a receipt image.");

      const extractedData = await ExpenseService.processReceiptUpload(req.file);

      return sendSuccess(
        res,
        200,
        extractedData,
        "OCR Extraction complete. Please review data.",
      );
    } catch (error) {
      console.error("OCR Error:", error);
      return sendError(res, 500, "Failed to process receipt image.");
    }
  }

  // Save Staff Verified Data to PENDING_APPROVAL
  static async submitPendingExpense(req, res) {
    try {
      const savedExpense = await ExpenseService.savePendingExpense(
        req.user.id,
        req.user.branchId,
        req.body,
        req.ip,
      );
      return sendSuccess(
        res,
        201,
        savedExpense,
        "Expense submitted and is pending Admin approval.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  // --- ADMIN (CHECKER) CONTROLLERS ---

  // Get the Master Approval Queue
  static async getPendingQueue(req, res) {
    try {
      const queue = await ExpenseService.getPendingApprovalQueue(
        req.user.branchId,
      );
      return sendSuccess(
        res,
        200,
        queue,
        "Pending approval queue fetched successfully.",
      );
    } catch (error) {
      return sendError(res, 500, "Failed to fetch approval queue.");
    }
  }

  // Fetch specific expense details
  static async getExpenseDetails(req, res) {
    try {
      const expense = await ExpenseService.getExpenseDetails(
        req.params.id,
        req.user.branchId,
      );
      if (!expense) return sendError(res, 404, "Expense not found.");
      return sendSuccess(res, 200, expense, "Expense details fetched.");
    } catch (error) {
      return sendError(res, 500, "Failed to fetch expense details.");
    }
  }

  // The Double-Action Trigger
  static async approveExpense(req, res) {
    try {
      // mappedItems = [{ lineItemId: 1, masterPartId: 4 }]
      const { mappedItems } = req.body;

      const result = await ExpenseService.approveExpense(
        req.user.id,
        req.user.branchId,
        req.params.id,
        mappedItems,
        req.ip,
      );
      return sendSuccess(
        res,
        200,
        result,
        "Expense Approved! Financial ledger and inventory updated.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  // Reject the scan
  static async rejectExpense(req, res) {
    try {
      const result = await ExpenseService.rejectExpense(
        req.user.id,
        req.user.branchId,
        req.params.id,
        req.ip,
      );
      return sendSuccess(
        res,
        200,
        result,
        "Expense Rejected. No inventory was touched.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }
}

module.exports = ExpenseController;
