const express = require("express");
const MechanicController = require("../../controllers/workshop/mechanicController");
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const branchGuard = require("../../middlewares/branchMiddleware");
const {
  createMechanicSchema,
  updateMechanicSchema,
} = require("../../validations/workshop.schema");
const { ROLES } = require("../../constants/roles");

const router = express.Router();

// ALL routes require JWT authentication and Branch Guard evaluation
router.use(verifyToken);
router.use(branchGuard);

// ----------------------------------------------------------------------
// SHARED ROUTE: Staff & Admin
// Staff needs this to populate the "Assign Mechanic" dropdown on Kanban Job Cards.
// Because branchGuard is active, Staff will ONLY receive mechanics from their branch.
// ----------------------------------------------------------------------
router.get(
  "/",
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  MechanicController.getMechanics,
);

// ----------------------------------------------------------------------
// ADMIN-ONLY ROUTES: CRUD Operations
// Only the Admin can hire, fire, edit, or transfer a mechanic.
// ----------------------------------------------------------------------
router.use(requireRole(ROLES.ADMIN));

router.post(
  "/",
  validate(createMechanicSchema),
  MechanicController.createMechanic,
);

router.put(
  "/:id",
  validate(updateMechanicSchema),
  MechanicController.updateMechanic,
);

module.exports = router;
