const express = require("express");
const router = express.Router();

// Controllers
const CoaController = require("../../controllers/manager/coa.controller");
const MechanicController = require("../../controllers/manager/mechanic.controller");
const ServiceController = require("../../controllers/manager/service.controller");
const InventoryController = require("../../controllers/manager/inventory.controller");

const BranchController = require("../../controllers/sysadmin/branch.controller");

// Middlewares
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Validations
const {
  createCoaSchema,
  updateCoaSchema,
} = require("../../validations/manager/coa.schema");
const {
  createMechanicSchema,
  updateMechanicSchema,
} = require("../../validations/manager/mechanic.schema");
const {
  createServiceSchema,
  updateServiceSchema,
} = require("../../validations/manager/service.schema");
const {
  createItemSchema,
  updateItemSchema,
} = require("../../validations/manager/inventory.schema");

// ==========================================
// GLOBAL SECURITY: Manager & Admin Only
// ==========================================
router.use(verifyToken, requireRole(ROLES.MANAGER, ROLES.ADMIN));

// ==========================================
// UTILITIES
// ==========================================
router.get("/branches", BranchController.getAllBranches);

router.get("/branches/active", BranchController.getActiveBranches);

// ==========================================
// SUB-TAB: CHART OF ACCOUNTS
// ==========================================
router.post(
  "/chart-of-accounts",
  validate(createCoaSchema),
  CoaController.createAccount,
);

router.get("/chart-of-accounts", CoaController.getAccounts);

router.put(
  "/chart-of-accounts/:id",
  validate(updateCoaSchema),
  CoaController.updateAccount,
);

// ==========================================
// SUB-TAB: MECHANICS REGISTRY
// ==========================================
router.post(
  "/mechanics",
  validate(createMechanicSchema),
  MechanicController.createMechanic,
);

router.get("/mechanics", MechanicController.getMechanics);

router.put(
  "/mechanics/:id",
  validate(updateMechanicSchema),
  MechanicController.updateMechanic,
);

// ==========================================
// SUB-TAB: SERVICES (LABOR CATALOG)
// ==========================================
router.post(
  "/services",
  validate(createServiceSchema),
  ServiceController.createService,
);

router.get("/services", ServiceController.getServices);

router.put(
  "/services/:id",
  validate(updateServiceSchema),
  ServiceController.updateService,
);

// ==========================================
// SUB-TAB: STOCK OVERVIEW (INVENTORY)
// ==========================================
router.post(
  "/inventory",
  validate(createItemSchema),
  InventoryController.createItem,
);
router.get("/inventory", InventoryController.getOverview);
router.put(
  "/inventory/:id",
  validate(updateItemSchema),
  InventoryController.updateItem,
);

module.exports = router;
