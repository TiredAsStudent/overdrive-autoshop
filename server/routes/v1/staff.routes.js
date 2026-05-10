const express = require("express");
const router = express.Router();

// Controllers
const StaffExpenseController = require("../../controllers/staff/expense.controller");
const SupplierController = require("../../controllers/manager/supplier.controller");
const StaffSettingsController = require("../../controllers/staff/settings.controller");

// Middlewares
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { uploadReceipt } = require("../../middlewares/uploadMiddleware");
const { ROLES } = require("../../constants/roles");

// Validations
const {
  submitStaffExpenseSchema,
} = require("../../validations/staff/expense.schema");

// ==========================================
// GLOBAL SECURITY: Staff Only
// ==========================================
router.use(verifyToken, requireRole(ROLES.STAFF));

// ==========================================
// UTILITIES
// ==========================================
router.get("/suppliers/active", SupplierController.getActive);

router.get("/settings/vat", StaffSettingsController.getVatRate);

// ==========================================
// EXPENSES: RECEIPT SCANNING FLOW
// ==========================================
// Step 1: Upload image and trigger Gemini OCR
router.post(
  "/expenses/scan",
  uploadReceipt.single("receipt_image"),
  StaffExpenseController.scanReceipt,
);

// Step 2: Submit verified data to the Manager's PENDING queue
router.post(
  "/expenses/submit",
  validate(submitStaffExpenseSchema),
  StaffExpenseController.submitExpense,
);

module.exports = router;
