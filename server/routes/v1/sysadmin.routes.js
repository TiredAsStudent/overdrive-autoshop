const express = require("express");
const router = express.Router();

// Controllers
const BranchController = require("../../controllers/sysadmin/branch.controller");

// Middlewares
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Validations
const {
  createBranchSchema,
  updateBranchSchema,
  toggleMaintenanceSchema,
} = require("../../validations/sysadmin/branch.schema");

// ==========================================
// GLOBAL SECURITY: SysAdmin Only
// ==========================================
router.use(verifyToken, requireRole(ROLES.ADMIN));

// ==========================================
// SUB-TAB 2.1: BRANCH MANAGEMENT
// ==========================================
router.post(
  "/branches",
  validate(createBranchSchema),
  BranchController.createBranch,
);

router.get("/branches", BranchController.getAllBranches);

router.get("/branches/:id", BranchController.getBranch);

router.put(
  "/branches/:id",
  validate(updateBranchSchema),
  BranchController.updateBranch,
);

router.delete("/branches/:id", BranchController.deleteBranch);

// The Security Kill-Switch
router.patch(
  "/branches/:id/maintenance",
  validate(toggleMaintenanceSchema),
  BranchController.toggleMaintenance,
);

module.exports = router;
