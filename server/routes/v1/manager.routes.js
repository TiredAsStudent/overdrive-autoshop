const express = require("express");
const router = express.Router();

// Controllers
const ServiceController = require("../../controllers/manager/service.controller");
const InventoryController = require("../../controllers/manager/inventory.controller");
const BranchController = require("../../controllers/sysadmin/branch.controller");
const StockAdjustmentController = require("../../controllers/manager/stockAdjustment.controller");
const StockTransferController = require("../../controllers/manager/stockTransfer.controller");
const POApprovalController = require("../../controllers/manager/poApproval.controller");

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

module.exports = router;
