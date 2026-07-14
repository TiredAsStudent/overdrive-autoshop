const express = require("express");
const router = express.Router();

// Controllers
const CustomerController = require("../../controllers/staff/customer.controller");

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

module.exports = router;
