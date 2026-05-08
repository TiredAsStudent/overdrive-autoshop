const express = require("express");
const router = express.Router();

// Controllers
const CoaController = require("../../controllers/manager/coa.controller");

// Middlewares
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Validations
const {
  createCoaSchema,
  updateCoaSchema,
} = require("../../validations/manager/coa.schema");

// ==========================================
// GLOBAL SECURITY: Manager & Admin Only
// ==========================================
router.use(verifyToken, requireRole(ROLES.MANAGER, ROLES.ADMIN));

// ==========================================
// SUB-TAB: CHART OF ACCOUNTS
// ==========================================
router.post(
  "/chart-of-accounts",
  validate(createCoaSchema),
  CoaController.createAccount,
);

router.get("/chart-of-accounts", CoaController.getAccounts);

router.put(
  "/chart-of-accounts/:id",
  validate(updateCoaSchema),
  CoaController.updateAccount,
);

module.exports = router;
