const express = require("express");
const router = express.Router();
const VehicleController = require("../../controllers/vehicleController");
const {
  authenticate,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Admin & Staff: Perform an Integrated Check-In
router.post(
  "/check-in",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  VehicleController.checkIn,
);

// Admin & Staff: Universal Plate-Based Medical Record Search
router.get(
  "/search/:plateNumber",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  VehicleController.getRecord,
);

module.exports = router;
