const pool = require("../config/db");

//Find a vehicle exactly by its plate
const findVehicleByPlate = async (plate) => {
  const query = "SELECT * FROM vehicles WHERE plate_number = $1";
  const result = await pool.query(query, [plate]);
  return result.rows[0];
};

// Register a new vehicle
const createVehicle = async (plate, make, model, year, owner) => {
  const query = `
    INSERT INTO vehicles (plate_number, make, model, year, owner_name) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING *;
  `;
  const result = await pool.query(query, [plate, make, model, year, owner]);
  return result.rows[0];
};

// The "History Aggregator": Pulls all past repairs across all branches
const getVehicleHistory = async (plate) => {
  const query = `
    SELECT id, branch_id, service_details, total_cost, service_date 
    FROM service_history 
    WHERE plate_number = $1 
    ORDER BY service_date DESC;
  `;
  const result = await pool.query(query, [plate]);
  return result.rows;
};

// Add a new service record (Used later when an Invoice is finalized)
const createServiceRecord = async (plate, branchId, details, cost) => {
  const query = `
    INSERT INTO service_history (plate_number, branch_id, service_details, total_cost) 
    VALUES ($1, $2, $3, $4) 
    RETURNING *;
  `;
  const result = await pool.query(query, [plate, branchId, details, cost]);
  return result.rows[0];
};

module.exports = {
  findVehicleByPlate,
  createVehicle,
  getVehicleHistory,
  createServiceRecord,
};
