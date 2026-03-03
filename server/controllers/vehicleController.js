const Vehicle = require("../models/vehicleModel");

// Strips all spaces and dashes, and forces uppercase (e.g., "ab c-12 3" to "ABC123")
const sanitizePlate = (plate) => {
  if (!plate) return "";
  return plate.replace(/[\s-]/g, "").toUpperCase();
};

// Register a new vehicle
const registerVehicle = async (req, res) => {
  try {
    const { plate_number, make, model, year, owner_name } = req.body;

    if (!plate_number || !make || !model || !owner_name) {
      return res
        .status(400)
        .json({ message: "Plate, make, model, and owner are required." });
    }

    const cleanPlate = sanitizePlate(plate_number);

    // Check if it already exists
    const existingVehicle = await Vehicle.findVehicleByPlate(cleanPlate);
    if (existingVehicle) {
      return res.status(409).json({
        message: `Vehicle with plate ${cleanPlate} is already registered.`,
      });
    }

    const newVehicle = await Vehicle.createVehicle(
      cleanPlate,
      make,
      model,
      year,
      owner_name,
    );
    res.status(201).json({
      message: "Vehicle registered successfully",
      vehicle: newVehicle,
    });
  } catch (error) {
    console.error("Vehicle Registration Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during registration." });
  }
};

// Search for a vehicle and aggregate its "Medical Record"
const searchVehicle = async (req, res) => {
  try {
    const rawPlate = req.params.plate;
    const cleanPlate = sanitizePlate(rawPlate);

    const vehicle = await Vehicle.findVehicleByPlate(cleanPlate);

    if (!vehicle) {
      return res
        .status(404)
        .json({ message: `No vehicle found for plate ${cleanPlate}.` });
    }

    // Pull the aggregated history across all branches
    const history = await Vehicle.getVehicleHistory(cleanPlate);

    res.status(200).json({
      message: "Medical Record retrieved.",
      vehicle: vehicle,
      medical_record: history,
    });
  } catch (error) {
    console.error("Vehicle Search Error:", error);
    res.status(500).json({ message: "Internal server error while searching." });
  }
};

// Add a history record
const addHistoryRecord = async (req, res) => {
  try {
    const { plate_number, service_details, total_cost } = req.body;

    // Automatically tags the repair with the logged-in staff member's specific branch
    const branch_id = req.user.branch_id;

    if (!plate_number || !service_details || total_cost === undefined) {
      return res
        .status(400)
        .json({ message: "Plate, details, and cost are required." });
    }

    const cleanPlate = sanitizePlate(plate_number);

    // Ensure the car actually exists before adding history
    const vehicle = await Vehicle.findVehicleByPlate(cleanPlate);
    if (!vehicle) {
      return res
        .status(404)
        .json({ message: "Cannot add record. Vehicle not found." });
    }

    const newRecord = await Vehicle.createServiceRecord(
      cleanPlate,
      branch_id,
      service_details,
      total_cost,
    );
    res.status(201).json({
      message: "Service record added successfully.",
      record: newRecord,
    });
  } catch (error) {
    console.error("Add History Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error adding service record." });
  }
};

module.exports = { registerVehicle, searchVehicle, addHistoryRecord };
