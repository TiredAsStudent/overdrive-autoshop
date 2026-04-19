const express = require("express");
const router = express.Router();

// Import all Manager Controllers
const OcrController = require("../../controllers/manager/approval.controller");
const AccountController = require("../../controllers/manager/finance.controller");
const InventoryController = require("../../controllers/manager/inventory.controller");
const MechanicController = require("../../controllers/manager/mechanic.controller");
const ServiceController = require("../../controllers/manager/service.controller");
const BranchController = require("../../controllers/manager/branch.controller");

// Import Security Guards & Validations
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const branchGuard = require("../../middlewares/branchMiddleware");
const { ROLES } = require("../../constants/roles");

const {
  approveReceiptSchema,
} = require("../../validations/manager/approval.schema");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../../validations/manager/finance.schema");
const {
  createInventorySchema,
  updateInventorySchema,
} = require("../../validations/manager/inventory.schema");
const {
  createMechanicSchema,
  updateMechanicSchema,
  createServiceSchema,
  updateServiceSchema,
} = require("../../validations/manager/workshop.schema");

// ==========================================
// GLOBAL PORTAL SECURITY
// Locks every single route below this line!
// ==========================================
router.use(verifyToken, requireRole(ROLES.ADMIN, ROLES.MANAGER));

// --- APPROVAL QUEUE (OCR) ---
router.get("/ocr", OcrController.getQueue);
router.get("/ocr/:id", OcrController.getDetails);
router.post(
  "/ocr/:id/approve",
  validate(approveReceiptSchema),
  OcrController.approve,
);
router.post("/ocr/:id/reject", OcrController.reject);

// --- FINANCE & ACCOUNTS ---
router.get("/accounts/categories", AccountController.getBaseCategories);
router.post(
  "/accounts",
  validate(createCategorySchema),
  AccountController.createAccount,
);
router.get("/accounts/balances", AccountController.getBalances);

router.put(
  "/accounts/:id",
  validate(updateCategorySchema),
  AccountController.updateAccount,
);

// --- MASTER INVENTORY ---
router.get("/inventory", InventoryController.getInventory);
router.post(
  "/inventory",
  validate(createInventorySchema),
  InventoryController.createInventoryItem,
);
router.put(
  "/inventory/:id",
  validate(updateInventorySchema),
  InventoryController.updateInventoryItem,
);

// --- WORKSHOP & MECHANICS ---
router.get("/mechanics", branchGuard, MechanicController.getMechanics);
router.post(
  "/mechanics",
  branchGuard,
  validate(createMechanicSchema),
  MechanicController.createMechanic,
);
router.put(
  "/mechanics/:id",
  branchGuard,
  validate(updateMechanicSchema),
  MechanicController.updateMechanic,
);
// --- SYSTEM HELPERS ---
router.get("/branches", BranchController.getBranches);

// --- SERVICES (COMBO MEALS) ---
router.get("/services", ServiceController.getServices);
router.post(
  "/services",
  validate(createServiceSchema),
  ServiceController.createService,
);
router.put(
  "/services/:id",
  validate(updateServiceSchema),
  ServiceController.updateService,
);

module.exports = router;
