const Vehicle = require("../models/vehicleModel");
const { sanitizePlate } = require("../utils/plateSanitizer");

exports.searchMedicalRecord = async (req, res) => {
  try {
    const rawPlate = req.params.plate_number;
    const cleanPlate = sanitizePlate(rawPlate);

    if (!cleanPlate) {
      return res.status(400).json({ error: "Invalid license plate format." });
    }

    // Fetch the Vehicle details
    const vehicle = await Vehicle.findByPlate(cleanPlate);
    if (!vehicle) {
      return res
        .status(404)
        .json({ error: "Vehicle not found. Please register it first." });
    }

    // Fetch the Aggregated History across all branches
    const history = await Vehicle.getMedicalRecord(vehicle.id);

    // Return the unified "Medical Record"
    res.status(200).json({
      message: "Medical record retrieved successfully.",
      vehicle: vehicle,
      service_history: history,
    });
  } catch (err) {
    console.error("Medical Record Search Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.registerNewVehicle = async (req, res) => {
  try {
    const { plate_number, make, model, year, owner_id } = req.body;
    const cleanPlate = sanitizePlate(plate_number);

    const existingVehicle = await Vehicle.findByPlate(cleanPlate);
    if (existingVehicle) {
      return res
        .status(400)
        .json({ error: "Vehicle with this plate already exists." });
    }

    const newVehicle = await Vehicle.createVehicle(
      cleanPlate,
      make,
      model,
      year,
      owner_id,
    );
    res.status(201).json({
      message: "Vehicle registered successfully",
      vehicle: newVehicle,
    });
  } catch (err) {
    console.error("Vehicle Registration Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.addRepairHistory = async (req, res) => {
  try {
    const { vehicle_id, description, mechanic_notes, total_cost } = req.body;

    const vehicleExists = await Vehicle.findById(vehicle_id);
    if (!vehicleExists) {
      return res.status(404).json({
        error:
          "Vehicle not found. Cannot add a repair record to a non-existent vehicle.",
      });
    }

    // Pull branch_id and mechanic_id securely from the JWT token via authMiddleware
    const branch_id = req.user.branch_id;
    const mechanic_id = req.user.id;

    const newRecord = await Vehicle.addServiceRecord(
      vehicle_id,
      branch_id,
      mechanic_id,
      description,
      mechanic_notes,
      total_cost,
    );
    res.status(201).json({
      message: "Repair history added successfully.",
      record: newRecord,
    });
  } catch (err) {
    console.error("Add Repair History Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};
