const express = require("express");
const router = express.Router();
const ServiceTemplateController = require("../../controllers/serviceTemplateController");
const {
  authenticate,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Admin & Staff: View Templates
router.get(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  ServiceTemplateController.getAll,
);

// Admin Only: Create, Update, or Soft-Delete Templates
router.post(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN),
  ServiceTemplateController.create,
);
router.put(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN),
  ServiceTemplateController.update,
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole(ROLES.ADMIN),
  ServiceTemplateController.toggleStatus,
);

module.exports = router;
