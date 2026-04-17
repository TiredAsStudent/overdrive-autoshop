const MechanicModel = require("../../models/workshop/mechanicModel");

class MechanicService {
  static async createMechanic(data, userId, ipAddress) {
    return await MechanicModel.createMechanicAndLogAudit(
      data,
      userId,
      ipAddress,
    );
  }

  static async getMechanics(branchId) {
    // If branchId is provided (e.g., a Staff member), they only see their branch.
    // If branchId is null (Admin on Global View), they see everyone.
    return await MechanicModel.getAllMechanics(branchId);
  }

  static async updateMechanic(id, updates, userId, ipAddress) {
    const existing = await MechanicModel.findMechanicById(id);
    if (!existing) {
      throw new Error("Mechanic not found.");
    }

    // Explicitly extract ONLY the allowed fields
    const safeUpdates = {};
    if (updates.first_name !== undefined)
      safeUpdates.first_name = updates.first_name;
    if (updates.last_name !== undefined)
      safeUpdates.last_name = updates.last_name;
    if (updates.specialization !== undefined)
      safeUpdates.specialization = updates.specialization;
    if (updates.contact_number !== undefined)
      safeUpdates.contact_number = updates.contact_number;
    if (updates.is_active !== undefined)
      safeUpdates.is_active = updates.is_active;

    // Allow Admin to transfer branch
    if (updates.branch_id !== undefined)
      safeUpdates.branch_id = updates.branch_id;

    if (Object.keys(safeUpdates).length === 0) {
      throw new Error("No valid fields provided for update.");
    }

    // Determine the relevant branch for the audit log (New branch if transferred, otherwise current)
    const targetBranchId = safeUpdates.branch_id || existing.branch_id;

    return await MechanicModel.updateMechanicAndLogAudit(
      id,
      safeUpdates,
      targetBranchId,
      userId,
      ipAddress,
    );
  }
}

module.exports = MechanicService;
