const express = require("express");
const router = express.Router();

// Controllers
const ServiceController = require("../../controllers/manager/service.controller");
const InventoryController = require("../../controllers/manager/inventory.controller");
const BranchController = require("../../controllers/sysadmin/branch.controller");
const StockAdjustmentController = require("../../controllers/manager/stockAdjustment.controller");
const StockTransferController = require("../../controllers/manager/stockTransfer.controller");
const POApprovalController = require("../../controllers/manager/poApproval.controller");
const ExpenseApprovalController = require("../../controllers/manager/expenseApproval.controller");
const ReceiptApprovalController = require("../../controllers/manager/receiptApproval.controller");
const ChartOfAccountsController = require("../../controllers/manager/chartOfAccounts.controller");

// Services
const SettingsService = require("../../services/sysadmin/settings.service");

// Middlewares
const validate = require("../../middlewares/validateMiddleware");
const branchGuard = require("../../middlewares/branchMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");

// Constants
const { ROLES } = require("../../constants/roles");

// Validations
const {
  createServiceSchema,
  updateServiceSchema,
  getServicesSchema,
  toggleServiceStatusSchema,
} = require("../../validations/manager/service.schema");
const {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  toggleInventoryStatusSchema,
  getInventorySchema,
  adjustStockSchema,
} = require("../../validations/manager/inventory.schema");
const {
  getAdjustmentsSchema,
  resolveAdjustmentSchema,
} = require("../../validations/manager/adjustment.schema");
const {
  executeTransferSchema,
  getTransfersSchema,
} = require("../../validations/manager/transfer.schema");
const {
  getPoApprovalsSchema,
  approvePoSchema,
  rejectPoSchema,
} = require("../../validations/manager/poApproval.schema");
const {
  getExpenseApprovalsSchema,
  approveExpenseSchema,
  rejectExpenseSchema,
} = require("../../validations/manager/expenseApproval.schema");
const {
  getReceiptApprovalsSchema,
  approveReceiptSchema,
  rejectReceiptSchema,
} = require("../../validations/manager/receiptApproval.schema");
const {
  createAccountSchema,
  updateAccountSchema,
  toggleAccountStatusSchema,
  getAccountsSchema,
} = require("../../validations/manager/chartOfAccounts.schema");

// ==========================================
// GLOBAL SECURITY: Manager & Admin Access
// ==========================================
router.use(verifyToken, requireRole(ROLES.MANAGER, ROLES.ADMIN));
router.use(branchGuard);

// ==========================================
// MODULE: SERVICE CATALOG
// ==========================================
router.post(
  "/services",
  validate(createServiceSchema),
  ServiceController.createService,
);
router.get(
  "/services",
  validate(getServicesSchema),
  ServiceController.getServices,
);
router.put(
  "/services/:id",
  validate(updateServiceSchema),
  ServiceController.updateService,
);
router.patch(
  "/services/:id/status",
  validate(toggleServiceStatusSchema),
  ServiceController.toggleServiceStatus,
);
router.get("/services/:id/usage", ServiceController.getServiceUsage);

// ==========================================
// MODULE: INVENTORY MANAGEMENT
// ==========================================
router.get("/settings/markup", async (req, res) => {
  try {
    const settings = await SettingsService.getBusinessSettings();
    res.status(200).json({
      success: true,
      data: { markup_percentage: settings.markup_percentage },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch markup configuration",
    });
  }
});
router.get("/branches/active", BranchController.getActiveBranches);
router.post(
  "/inventory",
  validate(createInventoryItemSchema),
  InventoryController.createMasterItem,
);
router.get(
  "/inventory",
  validate(getInventorySchema),
  InventoryController.getInventoryCatalog,
);
router.put(
  "/inventory/:id",
  validate(updateInventoryItemSchema),
  InventoryController.updateMasterItem,
);
router.patch(
  "/inventory/:id/status",
  validate(toggleInventoryStatusSchema),
  InventoryController.toggleItemStatus,
);
router.get("/inventory/:id/breakdown", InventoryController.getBranchBreakdown);
router.get("/inventory/:id/movements", InventoryController.getMovementHistory);

// ==========================================
// MODULE: STOCK ADJUSTMENTS (APPROVAL WORKFLOW)
// ==========================================
router.get(
  "/adjustments",
  validate(getAdjustmentsSchema),
  StockAdjustmentController.getRequests,
);
router.patch(
  "/adjustments/:id/approve",
  validate(resolveAdjustmentSchema),
  StockAdjustmentController.approveRequest,
);
router.patch(
  "/adjustments/:id/reject",
  validate(resolveAdjustmentSchema),
  StockAdjustmentController.rejectRequest,
);

// ==========================================
// MODULE: STOCK TRANSFERS
// ==========================================
router.get(
  "/transfers",
  validate(getTransfersSchema),
  StockTransferController.getTransfers,
);
router.post(
  "/transfers",
  validate(executeTransferSchema),
  StockTransferController.executeTransfer,
);

// ==========================================
// MODULE: PURCHASE ORDER APPROVALS
// ==========================================
router.get(
  "/approvals/purchase-orders/pending",
  validate(getPoApprovalsSchema),
  POApprovalController.getPendingApprovals,
);
router.get(
  "/approvals/purchase-orders/history",
  validate(getPoApprovalsSchema),
  POApprovalController.getApprovalHistory,
);
router.get("/approvals/purchase-orders/:id", POApprovalController.getPODetails);
router.patch(
  "/approvals/purchase-orders/:id/approve",
  validate(approvePoSchema),
  POApprovalController.approvePO,
);
router.patch(
  "/approvals/purchase-orders/:id/reject",
  validate(rejectPoSchema),
  POApprovalController.rejectPO,
);

// ==========================================
// MODULE: EXPENSE APPROVALS (MANUAL)
// ==========================================
router.get(
  "/approvals/expenses/pending",
  validate(getExpenseApprovalsSchema),
  ExpenseApprovalController.getPendingApprovals,
);
router.get(
  "/approvals/expenses/history",
  validate(getExpenseApprovalsSchema),
  ExpenseApprovalController.getApprovalHistory,
);
router.get(
  "/approvals/expenses/:id",
  ExpenseApprovalController.getExpenseDetails,
);
router.patch(
  "/approvals/expenses/:id/approve",
  validate(approveExpenseSchema),
  ExpenseApprovalController.approveExpense,
);
router.patch(
  "/approvals/expenses/:id/reject",
  validate(rejectExpenseSchema),
  ExpenseApprovalController.rejectExpense,
);

// ==========================================
// MODULE: RECEIPT APPROVALS (OCR INGESTION)
// ==========================================
router.get(
  "/approvals/receipts/pending",
  validate(getReceiptApprovalsSchema),
  ReceiptApprovalController.getPendingApprovals,
);
router.get(
  "/approvals/receipts/history",
  validate(getReceiptApprovalsSchema),
  ReceiptApprovalController.getApprovalHistory,
);
router.get(
  "/approvals/receipts/:id",
  ReceiptApprovalController.getReceiptDetails,
);
router.patch(
  "/approvals/receipts/:id/approve",
  validate(approveReceiptSchema),
  ReceiptApprovalController.approveReceipt,
);
router.patch(
  "/approvals/receipts/:id/reject",
  validate(rejectReceiptSchema),
  ReceiptApprovalController.rejectReceipt,
);

// ==========================================
// MODULE: ACCOUNTING - CHART OF ACCOUNTS
// ==========================================
router.post(
  "/accounting/accounts",
  validate(createAccountSchema),
  ChartOfAccountsController.createAccount,
);
router.get(
  "/accounting/accounts",
  validate(getAccountsSchema),
  ChartOfAccountsController.getAccounts,
);
router.get(
  "/accounting/accounts/:id/usage",
  ChartOfAccountsController.getAccountUsage,
);
router.get(
  "/accounting/accounts/:id",
  ChartOfAccountsController.getAccountDetails,
);
router.put(
  "/accounting/accounts/:id",
  validate(updateAccountSchema),
  ChartOfAccountsController.updateAccount,
);
router.patch(
  "/accounting/accounts/:id/status",
  validate(toggleAccountStatusSchema),
  ChartOfAccountsController.toggleStatus,
);

module.exports = router;
