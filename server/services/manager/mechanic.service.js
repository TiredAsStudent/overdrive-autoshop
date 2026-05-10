const Mechanic = require("../../models/Mechanic");
const Branch = require("../../models/Branch");
const { logSecureAction } = require("../../utils/auditLogger");

class MechanicService {
  static async enrollMechanic(data, managerId, ipAddress) {
    // 1. Auto-Generate the Employee ID (e.g., MECH-001, MECH-002)
    const lastId = await Mechanic.getLastEmployeeId();
    let nextNumber = 1;
    if (lastId) {
      const parts = lastId.split("-"); // Splits "MECH-001" into ["MECH", "001"]
      if (parts.length === 2) {
        nextNumber = parseInt(parts[1], 10) + 1;
      }
    }
    // Pad with zeros to keep it 3 digits long
    const newEmployeeId = `MECH-${String(nextNumber).padStart(3, "0")}`;
    const mechanicData = { ...data, employee_id: newEmployeeId };

    // 2. Verify branch exists
    const branch = await Branch.findById(mechanicData.branch_id);
    if (!branch) {
      throw new Error(
        "Invalid Branch Assignment. The selected branch does not exist.",
      );
    }

    const newMechanic = await Mechanic.create(mechanicData);

    // 3. Log the enrollment
    await logSecureAction(
      managerId,
      newMechanic.branch_id,
      "MECHANIC_ENROLLED",
      "INFO",
      ipAddress,
      "mechanics",
      newMechanic.id,
      null,
      newMechanic,
    );

    return newMechanic;
  }

  static async getAllMechanics() {
    return await Mechanic.findAll();
  }

  static async updateMechanic(id, data, managerId, ipAddress) {
    const oldMechanic = await Mechanic.findById(id);
    if (!oldMechanic) throw new Error("Mechanic profile not found.");

    // Check if it's a branch transfer
    let isBranchTransfer = false;
    if (
      data.branch_id &&
      parseInt(data.branch_id, 10) !== oldMechanic.branch_id
    ) {
      const branch = await Branch.findById(data.branch_id);
      if (!branch) throw new Error("Target transfer branch does not exist.");
      isBranchTransfer = true;
    }

    const updatedMechanic = await Mechanic.update(id, data);

    // Dynamic Audit Logging based on Capstone rules
    const actionType = isBranchTransfer
      ? "MECHANIC_BRANCH_TRANSFERRED"
      : "MECHANIC_PROFILE_UPDATED";
    const severity = isBranchTransfer ? "WARNING" : "INFO";

    await logSecureAction(
      managerId,
      updatedMechanic.branch_id,
      actionType,
      severity,
      ipAddress,
      "mechanics",
      id,
      oldMechanic,
      updatedMechanic,
    );

    return updatedMechanic;
  }
}

module.exports = MechanicService;
