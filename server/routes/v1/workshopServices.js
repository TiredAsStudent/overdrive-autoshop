const express = require("express");
const ServiceController = require("../../controllers/workshop/serviceController");
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const {
  createServiceSchema,
  updateServiceSchema,
} = require("../../validations/workshop.schema");
const { ROLES } = require("../../constants/roles");

const router = express.Router();

router.use(verifyToken);

// ----------------------------------------------------------------------
// SHARED ROUTE: Staff & Admin
// Staff uses this to populate the Estimate "Quick Buttons".
// The controller automatically filters to only show ACTIVE services for Staff.
// ----------------------------------------------------------------------
router.get(
  "/",
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  ServiceController.getServices,
);

// ----------------------------------------------------------------------
// ADMIN-ONLY ROUTES: Combo Meal Management
// ----------------------------------------------------------------------
router.use(requireRole(ROLES.ADMIN));

router.post(
  "/",
  validate(createServiceSchema),
  ServiceController.createService,
);

router.put(
  "/:id",
  validate(updateServiceSchema),
  ServiceController.updateService,
);

module.exports = router;
