const express = require("express");
const router = express.Router();

// Controllers
const CustomerController = require("../../controllers/staff/customer.controller");
const EstimateController = require("../../controllers/staff/estimate.controller");

// Bring in Read-Only Controllers for Estimates formulation
const ServiceController = require("../../controllers/manager/service.controller");
const InventoryController = require("../../controllers/manager/inventory.controller");
const SettingsController = require("../../controllers/sysadmin/settings.controller");

// Middlewares
const validate = require("../../middlewares/validateMiddleware");
const branchGuard = require("../../middlewares/branchMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Validations
const {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomersSchema,
} = require("../../validations/staff/customer.schema");
const {
  createEstimateSchema,
  updateStatusSchema,
  getEstimatesSchema,
} = require("../../validations/staff/estimate.schema");

// ==========================================
// GLOBAL SECURITY: Staff, Manager & Admin Access
// ==========================================
router.use(verifyToken, requireRole(ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN));
router.use(branchGuard);

// ==========================================
// MODULE: CUSTOMERS (CRM)
// ==========================================
router.post(
  "/customers",
  validate(createCustomerSchema),
  CustomerController.registerCustomer,
);
router.get(
  "/customers",
  validate(getCustomersSchema),
  CustomerController.getCustomers,
);
router.put(
  "/customers/:id",
  validate(updateCustomerSchema),
  CustomerController.updateCustomer,
);

// ==========================================
// MODULE: ESTIMATES (PRE-SALES)
// ==========================================
router.post(
  "/estimates",
  validate(createEstimateSchema),
  EstimateController.createEstimate,
);
router.get(
  "/estimates",
  validate(getEstimatesSchema),
  EstimateController.getEstimates,
);
router.get("/estimates/:id", EstimateController.getEstimateDetails);
router.patch(
  "/estimates/:id/status",
  validate(updateStatusSchema),
  EstimateController.updateStatus,
);

// ==========================================
// MODULE: READ-ONLY CATALOGS (For Estimate Form)
// ==========================================
router.get("/services", ServiceController.getServices);
router.get("/inventory", InventoryController.getInventoryCatalog);
router.get("/settings", SettingsController.getSettings);

module.exports = router;
