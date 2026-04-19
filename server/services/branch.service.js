const Branch = require("../models/Branch");
const User = require("../models/User");

class BranchService {
  static async createBranch(data, adminId, ipAddress) {
    const cleanCode = data.branch_code.toUpperCase().trim();

    const existingBranch = await Branch.findByCode(cleanCode);
    if (existingBranch) {
      throw new Error(`Branch code '${cleanCode}' is already in use.`);
    }

    const branchData = { ...data, branch_code: cleanCode };
    const newBranch = await Branch.create(branchData);

    // Add Audit Log for Creation
    await User.logAudit(adminId, newBranch.id, "BRANCH_CREATED", ipAddress);

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

    // Add Audit Log for Updates
    await User.logAudit(adminId, id, "BRANCH_UPDATED", ipAddress);

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

    // Add Audit Log for Security Toggles
    const actionStr = isMaintenanceMode
      ? "BRANCH_MAINTENANCE_LOCKED"
      : "BRANCH_MAINTENANCE_UNLOCKED";
    await User.logAudit(adminId, id, actionStr, ipAddress);

    return result;
  }

  static async deleteBranch(id, adminId, ipAddress) {
    const deleted = await Branch.softDelete(id);
    if (!deleted) throw new Error("Branch not found.");

    // Add Audit Log for Deletions
    await User.logAudit(adminId, id, "BRANCH_SOFT_DELETED", ipAddress);

    return deleted;
  }
}

module.exports = BranchService;
