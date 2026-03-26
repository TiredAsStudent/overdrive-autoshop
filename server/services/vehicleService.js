const db = require("../config/db");
const VehicleModel = require("../models/vehicleModel");
const UserModel = require("../models/userModel");
const AuditModel = require("../models/auditModel");
const AuthService = require("./authService");

class VehicleService {
  static async integratedCheckIn(staffId, branchId, vehicleData, ipAddress) {
    //Sanitize the License Plate
    const plateNumber = vehicleData.plateNumber
      .replace(/\s+/g, "")
      .toUpperCase();

    //Check if the car already exists
    const existingVehicle = await VehicleModel.findByPlate(plateNumber);
    if (existingVehicle) {
      throw new Error(
        `Vehicle with plate ${plateNumber} is already registered.`,
      );
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      //Register the Vehicle
      const newVehicle = await VehicleModel.create(
        plateNumber,
        vehicleData.make,
        vehicleData.model,
        vehicleData.year || null,
        vehicleData.color || null,
        vehicleData.ownerFirstName,
        vehicleData.ownerLastName,
        vehicleData.ownerEmail,
        vehicleData.ownerPhone || null,
        branchId,
        client,
      );

      //Check if the Owner has a Portal Account. If not, trigger the Welcome Link!
      const existingUser = await UserModel.findByEmail(
        vehicleData.ownerEmail,
        client,
      );
      let inviteData = null;
      let isNewCustomer = false;

      if (!existingUser) {
        inviteData = await AuthService.inviteCustomer(
          staffId,
          vehicleData.ownerEmail,
          branchId,
          ipAddress,
          client,
        );
        isNewCustomer = true;
      }

      //Log the Action
      await AuditModel.log(
        staffId,
        branchId,
        "VEHICLE_CHECK_IN",
        "vehicles",
        newVehicle.id,
        ipAddress,
        client,
      );

      await client.query("COMMIT");

      return {
        vehicle: newVehicle,
        isNewCustomer,
        customerInviteLink: inviteData ? inviteData.inviteLink : null,
        message: isNewCustomer
          ? "Vehicle registered and Customer Welcome Email sent!"
          : "Vehicle registered to existing customer.",
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Integrated Check-In failed: " + error.message);
    } finally {
      client.release();
    }
  }

  static async searchMedicalRecord(plateNumber) {
    const cleanPlate = plateNumber.replace(/\s+/g, "").toUpperCase();
    const record = await VehicleModel.getMedicalRecord(cleanPlate);

    if (!record) {
      throw new Error("No vehicle found with this license plate.");
    }

    return record;
  }
}

module.exports = VehicleService;
