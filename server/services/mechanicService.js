const db = require("../config/db");
const MechanicModel = require("../models/mechanicModel");
const AuditModel = require("../models/auditModel");

class MechanicService {
  static async registerMechanic(
    adminId,
    adminBranchId,
    mechanicData,
    ipAddress,
  ) {
    const { branchId, firstName, lastName, specialization } = mechanicData;
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const newMechanic = await MechanicModel.create(
        branchId,
        firstName,
        lastName,
        specialization,
        client,
      );

      await AuditModel.log(
        adminId,
        adminBranchId,
        "REGISTERED_MECHANIC",
        "mechanics",
        newMechanic.id,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return newMechanic;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(
        "Failed to register mechanic. Database transaction rolled back.",
      );
    } finally {
      client.release();
    }
  }

  static async getAllMechanics() {
    return await MechanicModel.findAll();
  }

  static async getMechanicsForDropdown(
    requesterRole,
    requesterBranchId,
    targetBranchId,
  ) {
    const branchToQuery =
      requesterRole === "STAFF" ? requesterBranchId : targetBranchId;
    if (!branchToQuery)
      throw new Error("Branch ID is required to fetch mechanics.");
    return await MechanicModel.findByBranch(branchToQuery);
  }

  // --- UPDATE LOGIC ---
  static async updateMechanic(
    adminId,
    adminBranchId,
    mechanicId,
    mechanicData,
    ipAddress,
  ) {
    const { branchId, firstName, lastName, specialization } = mechanicData;
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const updatedMechanic = await MechanicModel.update(
        mechanicId,
        branchId,
        firstName,
        lastName,
        specialization,
        client,
      );
      if (!updatedMechanic) throw new Error("Mechanic not found.");

      await AuditModel.log(
        adminId,
        adminBranchId,
        "UPDATED_MECHANIC_DETAILS",
        "mechanics",
        updatedMechanic.id,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return updatedMechanic;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Failed to update mechanic details.");
    } finally {
      client.release();
    }
  }

  // --- SOFT DELETE LOGIC ---
  static async toggleMechanicStatus(
    adminId,
    adminBranchId,
    mechanicId,
    isActive,
    ipAddress,
  ) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const updatedMechanic = await MechanicModel.updateStatus(
        mechanicId,
        isActive,
        client,
      );
      if (!updatedMechanic) throw new Error("Mechanic not found.");

      const actionLog = isActive
        ? "REACTIVATED_MECHANIC"
        : "DEACTIVATED_MECHANIC";
      await AuditModel.log(
        adminId,
        adminBranchId,
        actionLog,
        "mechanics",
        updatedMechanic.id,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return updatedMechanic;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Failed to change mechanic status.");
    } finally {
      client.release();
    }
  }
}

module.exports = MechanicService;
