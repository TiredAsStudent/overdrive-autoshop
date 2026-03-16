const Vehicle = require("../models/vehicleModel");
const { sanitizePlate } = require("../utils/plateSanitizer");
const catchAsync = require("../utils/catchAsync");

exports.searchMedicalRecord = catchAsync(async (req, res, next) => {
  const rawPlate = req.params.plate_number;
  const cleanPlate = sanitizePlate(rawPlate);

  if (!cleanPlate)
    return res.status(400).json({ error: "Invalid license plate format." });

  const vehicle = await Vehicle.findByPlate(cleanPlate);
  if (!vehicle)
    return res
      .status(404)
      .json({ error: "Vehicle not found. Please register it first." });

  const history = await Vehicle.getMedicalRecord(vehicle.id);

  res.status(200).json({
    message: "Medical record retrieved successfully.",
    vehicle: vehicle,
    service_history: history,
  });
});

exports.registerNewVehicle = catchAsync(async (req, res, next) => {
  const { plate_number, make, model, year, owner_id } = req.body;
  const cleanPlate = sanitizePlate(plate_number);

  const existingVehicle = await Vehicle.findByPlate(cleanPlate);
  if (existingVehicle)
    return res
      .status(400)
      .json({ error: "Vehicle with this plate already exists." });

  const newVehicle = await Vehicle.createVehicle(
    cleanPlate,
    make,
    model,
    year,
    owner_id,
  );
  res
    .status(201)
    .json({ message: "Vehicle registered successfully", vehicle: newVehicle });
});

exports.addRepairHistory = catchAsync(async (req, res, next) => {
  const { vehicle_id, description, mechanic_notes, total_cost } = req.body;

  const vehicleExists = await Vehicle.findById(vehicle_id);
  if (!vehicleExists)
    return res.status(404).json({ error: "Vehicle not found." });

  const branch_id =
    req.user.role === "Admin" && req.body.branch_id
      ? req.body.branch_id
      : req.user.branch_id;
  const mechanic_id = req.user.id;

  if (!branch_id)
    return res
      .status(400)
      .json({ error: "Branch ID is required to add history." });

  const newRecord = await Vehicle.addServiceRecord(
    vehicle_id,
    branch_id,
    mechanic_id,
    description,
    mechanic_notes,
    total_cost,
  );

  res
    .status(201)
    .json({ message: "Repair history added successfully.", record: newRecord });
});
