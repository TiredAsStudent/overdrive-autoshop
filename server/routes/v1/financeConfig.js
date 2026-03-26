const express = require("express");
const router = express.Router();
const FinanceConfigController = require("../../controllers/financeConfigController");
const {
  authenticate,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// --- CHART OF ACCOUNTS ROUTES ---
// Admin & Staff: View COA
router.get(
  "/coa",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  FinanceConfigController.getAllAccounts,
);

// Admin Only: Create or Edit the financial ledgers
router.post(
  "/coa",
  authenticate,
  requireRole(ROLES.ADMIN),
  FinanceConfigController.createAccount,
);
router.put(
  "/coa/:id",
  authenticate,
  requireRole(ROLES.ADMIN),
  FinanceConfigController.updateAccount,
);

// --- GLOBAL SETTINGS & TAX ENGINE ROUTES ---
// Admin & Staff: View the current Tax and Markup rules
router.get(
  "/settings",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  FinanceConfigController.getSettings,
);

// Admin Only: Update the engine variables
router.put(
  "/settings/:key",
  authenticate,
  requireRole(ROLES.ADMIN),
  FinanceConfigController.updateSetting,
);

module.exports = router;
