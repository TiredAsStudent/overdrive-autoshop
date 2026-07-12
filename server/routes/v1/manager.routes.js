const express = require("express");
const router = express.Router();

// Controllers
const ServiceController = require("../../controllers/manager/service.controller");
const InventoryController = require("../../controllers/manager/inventory.controller");
const BranchController = require("../../controllers/sysadmin/branch.controller");

// Services
const SettingsService = require("../../services/sysadmin/settings.service");

// Middlewares
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");

// Constants
const { ROLES } = require("../../constants/roles");

// Validations
const {
  createServiceSchema,
  getServicesSchema,
  toggleServiceStatusSchema,
} = require("../../validations/manager/service.schema");
const {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  toggleInventoryStatusSchema,
  getInventorySchema,
} = require("../../validations/manager/inventory.schema");

// ==========================================
// GLOBAL SECURITY: Manager & Admin Access
// ==========================================
// We allow ADMIN here as well so the owner/sysadmin can view the catalog if needed
router.use(verifyToken, requireRole(ROLES.MANAGER, ROLES.ADMIN));

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

router.patch(
  "/services/:id/status",
  validate(toggleServiceStatusSchema),
  ServiceController.toggleServiceStatus,
);

// ==========================================
// MODULE: INVENTORY MANAGEMENT
// ==========================================

//Expose the Admin Markup Percentage to the Manager Front-End safely
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

// Expose active branches to managers for filtering dropdowns
router.get("/branches/active", BranchController.getActiveBranches);

// Master Catalog CRUD
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

// Analytics & Movement Ledgers
router.get("/inventory/:id/breakdown", InventoryController.getBranchBreakdown);
router.get("/inventory/:id/movements", InventoryController.getMovementHistory);

module.exports = router;
