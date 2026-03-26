const express = require("express");
const router = express.Router();
const MechanicController = require("../../controllers/mechanicController");
const {
  authenticate,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Admin Only: Register a new mechanic
router.post(
  "/register",
  authenticate,
  requireRole(ROLES.ADMIN),
  MechanicController.register,
);

// Admin Only: View the global list of all mechanics
router.get(
  "/all",
  authenticate,
  requireRole(ROLES.ADMIN),
  MechanicController.getAll,
);

// Admin & Staff: Fetch mechanics for a specific branch
router.get(
  "/branch/:branchId",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  MechanicController.getByBranch,
);

// Admin Only: Update mechanic details (Name, Branch, Specialization)
router.put(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN),
  MechanicController.update,
);

// Admin Only: Soft delete (Deactivate) or Reactivate a mechanic
router.patch(
  "/:id/status",
  authenticate,
  requireRole(ROLES.ADMIN),
  MechanicController.toggleStatus,
);

module.exports = router;
