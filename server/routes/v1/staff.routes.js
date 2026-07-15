const express = require("express");
const router = express.Router();

// Controllers
const CustomerController = require("../../controllers/staff/customer.controller");
const EstimateController = require("../../controllers/staff/estimate.controller");
const SalesOrderController = require("../../controllers/staff/salesOrder.controller");
const InvoiceController = require("../../controllers/staff/invoice.controller");

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
const {
  createSalesOrderSchema,
  updateSalesOrderSchema,
  getSalesOrdersSchema,
} = require("../../validations/staff/salesOrder.schema");
const {
  createInvoiceSchema,
  updateInvoiceSchema,
  getInvoicesSchema,
} = require("../../validations/staff/invoice.schema");

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

// ==========================================
// MODULE: SALES ORDERS (OPERATIONAL WORK ORDERS)
// ==========================================
router.post(
  "/sales-orders",
  validate(createSalesOrderSchema),
  SalesOrderController.createSalesOrder,
);
router.get(
  "/sales-orders",
  validate(getSalesOrdersSchema),
  SalesOrderController.getSalesOrders,
);
router.get("/sales-orders/:id", SalesOrderController.getSalesOrderDetails);
router.patch(
  "/sales-orders/:id",
  validate(updateSalesOrderSchema),
  SalesOrderController.updateSalesOrder,
);

// ==========================================
// MODULE: INVOICES (OFFICIAL BILLING)
// ==========================================
router.post(
  "/invoices",
  validate(createInvoiceSchema),
  InvoiceController.createInvoice,
);
router.get(
  "/invoices",
  validate(getInvoicesSchema),
  InvoiceController.getInvoices,
);
router.get("/invoices/:id", InvoiceController.getInvoiceDetails);
router.patch(
  "/invoices/:id",
  validate(updateInvoiceSchema),
  InvoiceController.updateInvoice,
);

module.exports = router;
