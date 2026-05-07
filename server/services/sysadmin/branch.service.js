const Branch = require("../../models/Branch");
const { logSecureAction } = require("../../utils/auditLogger");

class BranchService {
  static async createBranch(data, adminId, ipAddress) {
    const cleanCode = data.branch_code.toUpperCase().trim();
    const existingBranch = await Branch.findByCode(cleanCode);

    if (existingBranch)
      throw new Error(`Branch code '${cleanCode}' is already in use.`);

    const newBranch = await Branch.create({ ...data, branch_code: cleanCode });
    await logSecureAction(
      adminId,
      null,
      "BRANCH_CREATED",
      "INFO",
      ipAddress,
      "branches",
      newBranch.id,
      null,
      data,
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
    let cleanData = { ...data };
    if (data.branch_code) {
      cleanData.branch_code = data.branch_code.toUpperCase().trim();
      const existing = await Branch.findByCode(cleanData.branch_code);
      if (existing && existing.id !== parseInt(id, 10)) {
        throw new Error(
          `Branch code '${cleanData.branch_code}' is already in use by another location.`,
        );
      }
    }

    const updatedBranch = await Branch.update(id, cleanData);
    if (!updatedBranch) throw new Error("Branch not found.");

    await logSecureAction(
      adminId,
      null,
      "BRANCH_UPDATED",
      "INFO",
      ipAddress,
      "branches",
      id,
      null,
      cleanData,
    );
    return updatedBranch;
  }

  static async toggleMaintenanceMode(
    id,
    isMaintenanceMode,
    adminId,
    ipAddress,
  ) {
    const result = await Branch.toggleMaintenance(id, isMaintenanceMode);
    if (!result) throw new Error("Branch not found.");

    const actionStr = isMaintenanceMode
      ? "BRANCH_MAINTENANCE_LOCKED"
      : "BRANCH_MAINTENANCE_UNLOCKED";
    const severity = isMaintenanceMode ? "CRITICAL" : "WARNING";

    await logSecureAction(
      adminId,
      null,
      actionStr,
      severity,
      ipAddress,
      "branches",
      id,
      null,
      { maintenance: isMaintenanceMode },
    );
    return result;
  }

  static async deleteBranch(id, adminId, ipAddress) {
    const deleted = await Branch.softDelete(id);
    if (!deleted) throw new Error("Branch not found.");

    await logSecureAction(
      adminId,
      null,
      "BRANCH_SOFT_DELETED",
      "CRITICAL",
      ipAddress,
      "branches",
      id,
    );
    return deleted;
  }
}

module.exports = BranchService;
