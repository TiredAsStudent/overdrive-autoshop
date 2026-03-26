const db = require("../config/db");

class VehicleModel {
  static async create(
    plateNumber,
    make,
    model,
    year,
    color,
    firstName,
    lastName,
    email,
    phone,
    branchId,
    client = db,
  ) {
    const query = `
      INSERT INTO vehicles (
        plate_number, make, model, year, color, 
        owner_first_name, owner_last_name, owner_email, owner_phone, registered_branch_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const result = await client.query(query, [
      plateNumber,
      make,
      model,
      year,
      color,
      firstName,
      lastName,
      email,
      phone,
      branchId,
    ]);
    return result.rows[0];
  }

  static async findByPlate(plateNumber, client = db) {
    const query = `SELECT * FROM vehicles WHERE plate_number = $1`;
    const result = await client.query(query, [plateNumber]);
    return result.rows[0];
  }

  // The foundation of the Medical Record.
  // In Phase 3, we will add a JOIN here to fetch the service history and OCR invoices.
  static async getMedicalRecord(plateNumber, client = db) {
    const query = `
      SELECT 
        v.id as vehicle_id, v.plate_number, v.make, v.model, v.year, v.color,
        v.owner_first_name, v.owner_last_name, v.owner_email, v.owner_phone,
        u.is_active as is_portal_active,
        COALESCE(
          (SELECT json_agg(row_to_json(history)) 
           FROM (
             -- Placeholder for Phase 3: SELECT * FROM service_jobs WHERE vehicle_id = v.id
             SELECT 'No history yet' as status
             WHERE false 
           ) history
          ), '[]'
        ) as service_history
      FROM vehicles v
      LEFT JOIN users u ON v.owner_email = u.email AND u.role = 'CUSTOMER'
      WHERE v.plate_number = $1;
    `;
    const result = await client.query(query, [plateNumber]);
    return result.rows[0];
  }
}

module.exports = VehicleModel;
