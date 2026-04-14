const express = require("express");
const AccountController = require("../../controllers/finance/accountController");
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const branchGuard = require("../../middlewares/branchMiddleware");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../../validations/finance.schema");
const { ROLES } = require("../../constants/roles");

const router = express.Router();

// ALL routes here require JWT
router.use(verifyToken);

// --- MAKER-CHECKER DROPDOWN (Shared: Staff & Admin) ---
// Staff needs this to tag OCR receipts with an EXPENSE category.
router.get(
  "/",
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  AccountController.getAllCategories,
);

// --- ADMIN-ONLY ROUTES ---
// Apply Admin role and Branch Guard for the remaining routes
router.use(requireRole(ROLES.ADMIN));
router.use(branchGuard);

// POST /api/v1/finance/accounts
router.post(
  "/",
  validate(createCategorySchema),
  AccountController.createCategory,
);

// PUT /api/v1/finance/accounts/:id
router.put(
  "/:id",
  validate(updateCategorySchema),
  AccountController.updateCategory,
);

// GET /api/v1/finance/accounts/balances
router.get("/balances", AccountController.getBalances);

module.exports = router;
