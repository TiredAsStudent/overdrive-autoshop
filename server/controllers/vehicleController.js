const Vehicle = require("../models/vehicleModel");

//REGISTER A NEW VEHICLE
const registerVehicle = async (req, res) => {
  try {
    const { plate_number, make, model, year, owner_name } = req.body;

    // Basic validation
    if (!plate_number || !make || !model || !owner_name) {
      return res.status(400).json({
        message: "Plate number, make, model, and owner name are required.",
      });
    }

    // Clean the plate number (Remove spaces and make uppercase: "abc 123" to "ABC123")
    const cleanPlate = plate_number.replace(/\s+/g, "").toUpperCase();

    // Check if the car already exists in the system
    const existingVehicle = await Vehicle.findVehicleByPlate(cleanPlate);
    if (existingVehicle) {
      return res.status(409).json({
        message: `Vehicle with plate ${cleanPlate} is already registered.`,
      });
    }

    // Save to the database
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
      .json({ message: "Internal server error while registering vehicle." });
  }
};

//SEARCH FOR A VEHICLE
const searchVehicle = async (req, res) => {
  try {
    // Grab the plate number from the URL (e.g., /api/vehicles/ABC123)
    const rawPlate = req.params.plate;

    // Clean the search query
    const cleanPlate = rawPlate.replace(/\s+/g, "").toUpperCase();

    const vehicle = await Vehicle.findVehicleByPlate(cleanPlate);

    if (!vehicle) {
      return res
        .status(404)
        .json({ message: `No vehicle found with plate number ${cleanPlate}.` });
    }

    res.status(200).json({
      message: "Vehicle found",
      vehicle: vehicle,
    });
  } catch (error) {
    console.error("Vehicle Search Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while searching for vehicle." });
  }
};

module.exports = { registerVehicle, searchVehicle };
