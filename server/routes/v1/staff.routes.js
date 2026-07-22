const express = require("express");
const router = express.Router();

// Controllers
const CustomerController = require("../../controllers/staff/customer.controller");
const EstimateController = require("../../controllers/staff/estimate.controller");
const SalesOrderController = require("../../controllers/staff/salesOrder.controller");
const InvoiceController = require("../../controllers/staff/invoice.controller");
const PaymentController = require("../../controllers/staff/payment.controller");
const VendorController = require("../../controllers/staff/vendor.controller");
const PurchaseOrderController = require("../../controllers/staff/purchaseOrder.controller");
const BillController = require("../../controllers/staff/bill.controller");
const ExpenseController = require("../../controllers/staff/expense.controller");

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
  updateEstimateSchema,
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
const {
  createPaymentSchema,
  getPaymentsSchema,
} = require("../../validations/staff/payment.schema");
const {
  createVendorSchema,
  updateVendorSchema,
  getVendorsSchema,
} = require("../../validations/staff/vendor.schema");
const {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updatePOStatusSchema,
  getPurchaseOrdersSchema,
} = require("../../validations/staff/purchaseOrder.schema");
const {
  createBillSchema,
  getBillsSchema,
} = require("../../validations/staff/bill.schema");
const {
  createExpenseSchema,
  updateExpenseSchema,
  updateExpenseStatusSchema,
  getExpensesSchema,
} = require("../../validations/staff/expense.schema");

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
router.put(
  "/estimates/:id",
  validate(updateEstimateSchema),
  EstimateController.updateEstimate,
);
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

// ==========================================
// MODULE: PAYMENTS (CASH COLLECTIONS)
// ==========================================
router.post(
  "/payments",
  validate(createPaymentSchema),
  PaymentController.recordPayment,
);
router.get(
  "/payments",
  validate(getPaymentsSchema),
  PaymentController.getPayments,
);
router.get("/payments/:id", PaymentController.getPaymentDetails);
router.patch("/payments/:id/void", PaymentController.voidPayment);

// ==========================================
// MODULE: VENDORS (SUPPLIER CRM)
// ==========================================
router.post(
  "/vendors",
  validate(createVendorSchema),
  VendorController.registerVendor,
);
router.get("/vendors", validate(getVendorsSchema), VendorController.getVendors);
router.put(
  "/vendors/:id",
  validate(updateVendorSchema),
  VendorController.updateVendor,
);

// ==========================================
// MODULE: PURCHASE ORDERS (PROCUREMENT)
// ==========================================
router.post(
  "/purchase-orders",
  validate(createPurchaseOrderSchema),
  PurchaseOrderController.createPurchaseOrder,
);
router.get(
  "/purchase-orders",
  validate(getPurchaseOrdersSchema),
  PurchaseOrderController.getPurchaseOrders,
);
router.get(
  "/purchase-orders/eligible-for-billing",
  PurchaseOrderController.getEligibleForBilling,
);
router.get(
  "/purchase-orders/:id",
  PurchaseOrderController.getPurchaseOrderDetails,
);
router.put(
  "/purchase-orders/:id",
  validate(updatePurchaseOrderSchema),
  PurchaseOrderController.updatePurchaseOrder,
);
router.patch(
  "/purchase-orders/:id/status",
  validate(updatePOStatusSchema),
  PurchaseOrderController.updateStatus,
);

// ==========================================
// MODULE: SUPPLIER BILLS (ACCOUNTS PAYABLE)
// ==========================================
router.post("/bills", validate(createBillSchema), BillController.createBill);
router.get("/bills", validate(getBillsSchema), BillController.getBills);
router.get("/bills/:id", BillController.getBillDetails);

router.patch("/bills/:id/receive", BillController.confirmReceipt);

// ==========================================
// MODULE: OPERATIONAL EXPENSES (OpEx)
// ==========================================
router.post(
  "/expenses",
  validate(createExpenseSchema),
  ExpenseController.createExpense,
);
router.get(
  "/expenses",
  validate(getExpensesSchema),
  ExpenseController.getExpenses,
);
router.get("/expenses/:id", ExpenseController.getExpenseDetails);
router.put(
  "/expenses/:id",
  validate(updateExpenseSchema),
  ExpenseController.updateExpense,
);
router.patch(
  "/expenses/:id/status",
  validate(updateExpenseStatusSchema),
  ExpenseController.updateStatus,
);

module.exports = router;
