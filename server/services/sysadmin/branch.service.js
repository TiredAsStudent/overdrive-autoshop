const Branch = require("../../models/Branch");
const { logSecureAction } = require("../../utils/auditLogger");

class BranchService {
  static async createBranch(data, adminId, ipAddress) {
    // Enforce Uppercase Prefix Logic (e.g., 'cab' -> 'CAB')
    const cleanCode = data.branch_code.toUpperCase().trim();
    const existingBranch = await Branch.findByCode(cleanCode);

    if (existingBranch) {
      throw new Error(`Branch Prefix Code '${cleanCode}' is already in use.`);
    }

    const newBranch = await Branch.create({ ...data, branch_code: cleanCode });

    // Log the exact Transaction ID link for forensic auditing
    await logSecureAction(
      adminId,
      null,
      "BRANCH_CREATED",
      "INFO",
      ipAddress,
      "branches", // target_resource
      newBranch.id, // target_id
      null,
      newBranch,
    );

    return newBranch;
  }

  static async getAllBranches() {
    return await Branch.findAll();
  }

  static async getBranchById(id) {
    const branch = await Branch.findById(id);
    if (!branch) throw new Error("Branch not found.");
    return branch;
  }

  static async updateBranch(id, data, adminId, ipAddress) {
    const oldBranch = await Branch.findById(id);
    if (!oldBranch) throw new Error("Branch not found.");

    let cleanData = { ...data };

    if (data.branch_code) {
      cleanData.branch_code = data.branch_code.toUpperCase().trim();
      const existing = await Branch.findByCode(cleanData.branch_code);
      if (existing && existing.id !== parseInt(id, 10)) {
        throw new Error(
          `Branch Prefix Code '${cleanData.branch_code}' is already assigned to another location.`,
        );
      }
    }

    const updatedBranch = await Branch.update(id, cleanData);

    await logSecureAction(
      adminId,
      null,
      "BRANCH_PROFILE_UPDATED",
      "WARNING", // Warning severity because changing legal identity is sensitive
      ipAddress,
      "branches",
      id,
      oldBranch, // old_values for Data Delta comparison
      updatedBranch, // new_values
    );

    return updatedBranch;
  }

  static async toggleMaintenanceMode(
    id,
    isMaintenanceMode,
    adminId,
    ipAddress,
  ) {
    const branch = await Branch.findById(id);
    if (!branch) throw new Error("Branch not found.");

    const result = await Branch.toggleMaintenance(id, isMaintenanceMode);

    const actionStr = isMaintenanceMode
      ? "BRANCH_MAINTENANCE_LOCKED"
      : "BRANCH_MAINTENANCE_UNLOCKED";
    const severity = isMaintenanceMode ? "CRITICAL" : "WARNING"; // CRITICAL because it freezes operations

    await logSecureAction(
      adminId,
      null,
      actionStr,
      severity,
      ipAddress,
      "branches",
      id,
      { is_maintenance_mode: branch.is_maintenance_mode },
      { is_maintenance_mode: isMaintenanceMode },
    );

    return result;
  }

  static async deleteBranch(id, adminId, ipAddress) {
    const branch = await Branch.findById(id);
    if (!branch) throw new Error("Branch not found.");

    if (!branch.is_active) throw new Error("Branch is already archived.");

    const deleted = await Branch.softDelete(id);

    await logSecureAction(
      adminId,
      null,
      "BRANCH_ARCHIVED",
      "CRITICAL",
      ipAddress,
      "branches",
      id,
      { is_active: true },
      { is_active: false },
    );

    return deleted;
  }
}

module.exports = BranchService;
