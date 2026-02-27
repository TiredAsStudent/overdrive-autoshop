const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");

// Middleware
const { verifyToken } = require("../middleware/authMiddleware");

// POST /api/vehicles/register
router.post("/register", verifyToken, vehicleController.registerVehicle);

// GET /api/vehicles/:plate
router.get("/:plate", verifyToken, vehicleController.searchVehicle);

module.exports = router;
