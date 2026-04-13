const express = require("express");
const SystemSettingsController = require("../../controllers/controlCenter/SystemSettingsController");
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const {
  updateFinancialsSchema,
  updateBranchSchema,
} = require("../../validations/systemSettings.schema");
const { ROLES } = require("../../constants/roles");

const router = express.Router();

// ALL routes here require the user to be logged in AND be an ADMIN
router.use(verifyToken);
router.use(requireRole(ROLES.ADMIN));

// --- FINANCIAL SETTINGS ROUTES ---
router.get("/financials", SystemSettingsController.getFinancials);

router.put(
  "/financials",
  validate(updateFinancialsSchema),
  SystemSettingsController.updateFinancials,
);

// --- BRANCH SETTINGS ROUTES ---
router.get("/branches", SystemSettingsController.getBranches);

router.put(
  "/branches/:id",
  validate(updateBranchSchema),
  SystemSettingsController.updateBranch,
);

module.exports = router;
