const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.use(verifyToken);

//Get Vehicle Medical Record by Plate (Admin & Staff)
router.get(
  "/:plate_number",
  requireRole(["Admin", "Staff"]),
  vehicleController.searchMedicalRecord,
);

//Register a new vehicle to the shop floor
router.post(
  "/register",
  requireRole(["Admin", "Staff"]),
  vehicleController.registerNewVehicle,
);

//Add a completed repair to the vehicle's history
router.post(
  "/service-record",
  requireRole(["Admin", "Staff"]),
  vehicleController.addRepairHistory,
);

module.exports = router;
