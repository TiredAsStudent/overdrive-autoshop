const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");

// Middleware
const { verifyToken } = require("../middleware/authMiddleware");
router.use(verifyToken);

// POST /api/vehicles/register
router.post("/register", vehicleController.registerVehicle);

// GET /api/vehicles/:plate
router.get("/:plate", vehicleController.searchVehicle);

// POST /api/vehicles/history
router.post("/history", vehicleController.addHistoryRecord);

module.exports = router;
