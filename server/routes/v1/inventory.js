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

// --- STOCK TRANSFER HUB ---
// Admin Only: Execute Atomic Transfers between branches
router.post(
  "/transfer",
  authenticate,
  requireRole(ROLES.ADMIN),
  InventoryController.transferStock,
);

// --- INVENTORY SECURITY (MAKER-CHECKER) ---
// Staff (Maker): Submit a stock correction request for damage/loss
router.post(
  "/adjustments",
  authenticate,
  requireRole(ROLES.STAFF),
  InventoryController.requestAdjustment,
);

// Admin (Checker): Approve or Reject the request
router.patch(
  "/adjustments/:id/resolve",
  authenticate,
  requireRole(ROLES.ADMIN),
  InventoryController.resolveAdjustment,
);

module.exports = router;
