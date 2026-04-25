const { query, pool } = require("../config/db");

class CheckInModel {
  static async findVehicleByPlate(plateNumber) {
    // Pulls the vehicle, owner info, AND the Medical History Summary in one query
    const sql = `
      SELECT 
        v.*, 
        u.first_name, u.last_name, u.email, u.is_active as is_portal_active,
        (SELECT MAX(created_at) FROM job_cards WHERE vehicle_id = v.id) as last_visit_date,
        (SELECT COUNT(id) FROM job_cards WHERE vehicle_id = v.id) as total_visits
      FROM vehicles v
      LEFT JOIN users u ON v.owner_id = u.id
      WHERE v.plate_number = $1
    `;
    const result = await query(sql, [plateNumber]);
    return result.rows[0];
  }

  static async registerAndCheckInNew(customerEmail, plateNumber, checkInData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Create Pending Customer (Uses Path B inputs or fallbacks to Path A placeholders)
      const userSql = `
        INSERT INTO users (email, role, first_name, last_name, is_active, activation_token) 
        VALUES ($1, 'CUSTOMER', $2, $3, FALSE, $4) RETURNING id
      `;
      const userRes = await client.query(userSql, [
        customerEmail,
        checkInData.firstName || "Valued",
        checkInData.lastName || "Customer",
        checkInData.hashedToken,
      ]);
      const newOwnerId = userRes.rows[0].id;

      // 2. Create Vehicle Profile (Applies Predictive Math)
      const vehicleSql = `
        INSERT INTO vehicles (owner_id, plate_number, make, model, year, last_odometer_reading, next_service_odometer) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
      `;
      const vehicleRes = await client.query(vehicleSql, [
        newOwnerId,
        plateNumber,
        checkInData.make || null,
        checkInData.model || null,
        checkInData.year || null,
        checkInData.odometer,
        checkInData.nextServiceOdo,
      ]);
      const newVehicleId = vehicleRes.rows[0].id;

      // 3. Generate Job Card
      const jobSql = `
        INSERT INTO job_cards (branch_id, vehicle_id, mechanic_id, staff_id, service_intent, check_in_odometer, next_service_odometer) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
      `;
      const jobRes = await client.query(jobSql, [
        checkInData.branchId,
        newVehicleId,
        checkInData.mechanicId || null,
        checkInData.staffId,
        checkInData.serviceIntent,
        checkInData.odometer,
        checkInData.nextServiceOdo,
      ]);

      await client.query("COMMIT");
      return {
        ownerId: newOwnerId,
        vehicleId: newVehicleId,
        jobCardId: jobRes.rows[0].id,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async checkInExisting(vehicleId, checkInData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Update Historical Odometer & Predictive Target
      await client.query(
        `UPDATE vehicles SET last_odometer_reading = $1, next_service_odometer = $2, updated_at = NOW() WHERE id = $3`,
        [checkInData.odometer, checkInData.nextServiceOdo, vehicleId],
      );

      // 2. Generate Job Card
      const jobSql = `
        INSERT INTO job_cards (branch_id, vehicle_id, mechanic_id, staff_id, service_intent, check_in_odometer, next_service_odometer) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
      `;
      const jobRes = await client.query(jobSql, [
        checkInData.branchId,
        vehicleId,
        checkInData.mechanicId || null,
        checkInData.staffId,
        checkInData.serviceIntent,
        checkInData.odometer,
        checkInData.nextServiceOdo,
      ]);

      await client.query("COMMIT");
      return { jobCardId: jobRes.rows[0].id };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = CheckInModel;
