const pool = require("../config/db");

const Vehicle = {
  // Find a vehicle by its exact sanitized plate number
  findByPlate: async (plate_number) => {
    const result = await pool.query(
      "SELECT * FROM vehicles WHERE plate_number = $1",
      [plate_number],
    );
    return result.rows[0];
  },

  //Find a vehicle by its exact database ID
  findById: async (id) => {
    const result = await pool.query("SELECT id FROM vehicles WHERE id = $1", [
      id,
    ]);
    return result.rows[0];
  },

  // Register a new vehicle
  createVehicle: async (plate_number, make, model, year, owner_id) => {
    const result = await pool.query(
      `INSERT INTO vehicles (plate_number, make, model, year, owner_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [plate_number, make, model, year, owner_id || null],
    );
    return result.rows[0];
  },

  // Pulls all records across all 3 branches
  getMedicalRecord: async (vehicle_id) => {
    const result = await pool.query(
      `SELECT 
          sr.id AS record_id,
          sr.service_date,
          sr.description,
          sr.mechanic_notes,
          sr.total_cost,
          sr.status,
          b.branch_name,
          u.full_name AS mechanic_name
       FROM service_records sr
       LEFT JOIN branches b ON sr.branch_id = b.id
       LEFT JOIN users u ON sr.mechanic_id = u.id
       WHERE sr.vehicle_id = $1
       ORDER BY sr.service_date DESC`,
      [vehicle_id],
    );
    return result.rows;
  },

  // Add a new service record
  addServiceRecord: async (
    vehicle_id,
    branch_id,
    mechanic_id,
    description,
    mechanic_notes,
    total_cost,
  ) => {
    const result = await pool.query(
      `INSERT INTO service_records (vehicle_id, branch_id, mechanic_id, description, mechanic_notes, total_cost)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        vehicle_id,
        branch_id,
        mechanic_id,
        description,
        mechanic_notes,
        total_cost,
      ],
    );
    return result.rows[0];
  },
};

module.exports = Vehicle;
