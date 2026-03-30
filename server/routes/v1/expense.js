const express = require("express");
const router = express.Router();
const multer = require("multer");
const ExpenseController = require("../../controllers/expenseController");
const {
  authenticate,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Keep file in memory so Sharp can process it instantly before saving
const upload = multer({ storage: multer.memoryStorage() });

// Staff: Get the COA Categories for the Dropdown
router.get(
  "/categories",
  authenticate,
  requireRole(ROLES.STAFF, ROLES.ADMIN),
  ExpenseController.getCategories,
);

// Staff: Upload Image for OCR Extraction (form-data key: 'receiptImage')
router.post(
  "/ocr-scan",
  authenticate,
  requireRole(ROLES.STAFF, ROLES.ADMIN),
  upload.single("receiptImage"),
  ExpenseController.extractOcrData,
);

// Staff: Save the reviewed JSON data to the Waiting Room
router.post(
  "/draft",
  authenticate,
  requireRole(ROLES.STAFF, ROLES.ADMIN),
  ExpenseController.submitPendingExpense,
);

// --- Admin (Checker) Routes ---

// Admin: View all PENDING_APPROVAL expenses
router.get(
  "/pending",
  authenticate,
  requireRole(ROLES.ADMIN),
  ExpenseController.getPendingQueue,
);

// Admin: View specific expense details and the OCR line items
router.get(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN),
  ExpenseController.getExpenseDetails,
);

// Admin: The Double-Action Trigger (Approves Ledger + Restocks Inventory + Dynamic Markup)
// Expected Body: { mappedItems: [{ lineItemId: 1, masterPartId: 4 }] }
router.patch(
  "/:id/approve",
  authenticate,
  requireRole(ROLES.ADMIN),
  ExpenseController.approveExpense,
);

// Admin: Reject the expense (Deletes nothing, just changes status to REJECTED)
router.patch(
  "/:id/reject",
  authenticate,
  requireRole(ROLES.ADMIN),
  ExpenseController.rejectExpense,
);

module.exports = router;
