const express = require("express");
const router = express.Router();
const InventoryController = require("../../controllers/inventoryController");
const {
  authenticate,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// --- MASTER INVENTORY ---
// Admin & Staff: View the Official Catalog
router.get(
  "/master",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  InventoryController.getCatalog,
);

// Admin Only: Add new items to the Catalog
router.post(
  "/master",
  authenticate,
  requireRole(ROLES.ADMIN),
  InventoryController.createMasterPart,
);

// Admin Only: Update Master Catalog Items (Prices, Names)
router.put(
  "/master/:id",
  authenticate,
  requireRole(ROLES.ADMIN),
  InventoryController.updateMasterPart,
);

// Admin Only: Soft-Delete Master Catalog Items
router.patch(
  "/master/:id/status",
  authenticate,
  requireRole(ROLES.ADMIN),
  InventoryController.toggleStatus,
);

// --- LOCAL STOCK API ---
// Staff & Admin: View physical items on the shelves
router.get(
  "/local",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  InventoryController.getLocalStock,
);

// --- STOCK TRANSFER HUB ---
// Admin Only: Direct execute Atomic Transfers
router.post(
  "/transfer",
  authenticate,
  requireRole(ROLES.ADMIN),
  InventoryController.transferStock,
);

// --- TRANSFER REQUESTS (INTER-BRANCH) ---
// Staff (Maker): Request parts from another branch
router.post(
  "/transfer-requests",
  authenticate,
  requireRole(ROLES.STAFF),
  InventoryController.requestInterBranchTransfer,
);
// Admin (Checker): Approve or Reject the inter-branch transfer
router.patch(
  "/transfer-requests/:id/resolve",
  authenticate,
  requireRole(ROLES.ADMIN),
  InventoryController.resolveTransferRequest,
);

// --- INVENTORY SECURITY (ADJUSTMENTS) ---
// Staff (Maker): Submit a stock correction request for damage/loss
router.post(
  "/adjustments",
  authenticate,
  requireRole(ROLES.STAFF),
  InventoryController.requestAdjustment,
);
// Admin (Checker): Approve or Reject the adjustment
router.patch(
  "/adjustments/:id/resolve",
  authenticate,
  requireRole(ROLES.ADMIN),
  InventoryController.resolveAdjustment,
);

module.exports = router;
