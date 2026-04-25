const express = require("express");
const router = express.Router();

// Import Staff-Specific Controllers
const StaffInventoryController = require("../../controllers/staff/inventory.controller");

// Import Manager Controllers for the "Shared Read-Only" dropdowns!
const AccountController = require("../../controllers/manager/finance.controller");
const InventoryController = require("../../controllers/manager/inventory.controller");
const MechanicController = require("../../controllers/manager/mechanic.controller");
const ServiceController = require("../../controllers/manager/service.controller");

// Import Security Guards
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const branchGuard = require("../../middlewares/branchMiddleware");
const { ROLES } = require("../../constants/roles");

// ==========================================
// GLOBAL PORTAL SECURITY
// ==========================================
router.use(verifyToken, requireRole(ROLES.STAFF, ROLES.ADMIN), branchGuard);

// --- LOCAL STOCK ROOM ---
router.get("/inventory/local", StaffInventoryController.getLocalStock);
router.get(
  "/inventory/:inventoryId/global",
  StaffInventoryController.getGlobalStock,
);

// --- SHARED READ-ONLY ROUTES ---
router.get("/accounts/categories", AccountController.getBaseCategories);
router.get("/inventory/master", InventoryController.getInventory);
router.get("/mechanics", MechanicController.getMechanics);
router.get("/services", ServiceController.getServices);

module.exports = router;
