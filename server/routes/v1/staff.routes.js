const express = require("express");
const router = express.Router();

// Controllers
const CustomerController = require("../../controllers/staff/customer.controller");
const EstimateController = require("../../controllers/staff/estimate.controller");

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
// Sales operations are frontline but visible to management
router.use(verifyToken, requireRole(ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN));

// branchGuard ensures req.branchId is correctly injected based on the logged-in user
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

module.exports = router;
