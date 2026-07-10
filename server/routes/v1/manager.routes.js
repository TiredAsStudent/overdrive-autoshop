const express = require("express");
const router = express.Router();

// Controllers
const ServiceController = require("../../controllers/manager/service.controller");

// Middlewares
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");

// Constants
const { ROLES } = require("../../constants/roles");

// Validations
const {
  createServiceSchema,
  getServicesSchema,
  toggleServiceStatusSchema,
} = require("../../validations/manager/service.schema");

// ==========================================
// GLOBAL SECURITY: Manager & Admin Access
// ==========================================
// We allow ADMIN here as well so the owner/sysadmin can view the catalog if needed
router.use(verifyToken, requireRole(ROLES.MANAGER, ROLES.ADMIN));

// ==========================================
// MODULE: SERVICE CATALOG
// ==========================================
router.post(
  "/services",
  validate(createServiceSchema),
  ServiceController.createService,
);

router.get(
  "/services",
  validate(getServicesSchema),
  ServiceController.getServices,
);

router.patch(
  "/services/:id/status",
  validate(toggleServiceStatusSchema),
  ServiceController.toggleServiceStatus,
);

module.exports = router;
