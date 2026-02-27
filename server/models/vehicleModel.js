const pool = require("../config/db");

// Find a vehicle exactly by its plate number
const findVehicleByPlate = async (plateNumber) => {
  const query = "SELECT * FROM vehicles WHERE plate_number = $1";
  const result = await pool.query(query, [plateNumber]);
  return result.rows[0]; // Returns the car object or undefined
};

// Insert a brand new vehicle into the archive
const createVehicle = async (plateNumber, make, model, year, ownerName) => {
  const query = `
        INSERT INTO vehicles (plate_number, make, model, year, owner_name) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *;
    `;
  const result = await pool.query(query, [
    plateNumber,
    make,
    model,
    year,
    ownerName,
  ]);
  return result.rows[0];
};

module.exports = {
  findVehicleByPlate,
  createVehicle,
};
