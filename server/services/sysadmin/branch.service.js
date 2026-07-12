const Branch = require("../../models/Branch");
const { logSecureAction } = require("../../utils/auditLogger");

class BranchService {
  static async getAllBranches(
    page = 1,
    limit = 5,
    search = "",
    status = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, branches] = await Promise.all([
      Branch.countFiltered(search, status),
      Branch.findPaginatedFiltered(limit, offset, search, status),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      branches,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async getActiveBranches() {
    return await Branch.findActive();
  }

  static async getBranchById(id) {
    const branch = await Branch.findById(id);
    if (!branch) throw new Error("Branch not found.");
    return branch;
  }

  static async createBranch(data, adminId, ipAddress) {
    const existingBranch = await Branch.findByCode(data.branch_code);
    if (existingBranch) {
      throw new Error(`Branch Code '${data.branch_code}' is already in use.`);
    }

    const newBranch = await Branch.create(data);

    const { query } = require("../../config/db");
    const syncSql = `
      INSERT INTO branch_inventory (branch_id, item_id, quantity, reorder_point)
      SELECT $1, id, 0, default_reorder_level 
      FROM inventory_items 
      WHERE is_active = TRUE
      ON CONFLICT DO NOTHING
    `;
    await query(syncSql, [newBranch.id]);

    await logSecureAction(
      adminId,
      newBranch.id,
      "BRANCH_CREATED",
      "INFO",
      ipAddress,
      "branches",
      newBranch.id,
      null,
      newBranch,
    );

    return newBranch;
  }

  static async updateBranch(id, data, adminId, ipAddress) {
    const oldBranch = await Branch.findById(id);
    if (!oldBranch) throw new Error("Branch not found.");

    const updatedBranch = await Branch.update(id, data);

    await logSecureAction(
      adminId,
      id,
      "BRANCH_UPDATED",
      "WARNING",
      ipAddress,
      "branches",
      id,
      oldBranch,
      updatedBranch,
    );

    return updatedBranch;
  }

  static async toggleMaintenance(id, isMaintenanceMode, adminId, ipAddress) {
    const oldBranch = await Branch.findById(id);
    if (!oldBranch) throw new Error("Branch not found.");

    const updatedBranch = await Branch.toggleMaintenance(id, isMaintenanceMode);

    const action = isMaintenanceMode
      ? "BRANCH_MAINTENANCE_ENABLED"
      : "BRANCH_MAINTENANCE_DISABLED";
    const severity = isMaintenanceMode ? "CRITICAL" : "INFO";

    await logSecureAction(
      adminId,
      id,
      action,
      severity,
      ipAddress,
      "branches",
      id,
      { is_maintenance_mode: oldBranch.is_maintenance_mode },
      { is_maintenance_mode: updatedBranch.is_maintenance_mode },
    );

    return updatedBranch;
  }

  static async deleteBranch(id, adminId, ipAddress) {
    const oldBranch = await Branch.findById(id);
    if (!oldBranch) throw new Error("Branch not found.");

    const deletedBranch = await Branch.softDelete(id);

    await logSecureAction(
      adminId,
      id,
      "BRANCH_DEACTIVATED",
      "CRITICAL",
      ipAddress,
      "branches",
      id,
      { is_active: oldBranch.is_active },
      { is_active: deletedBranch.is_active },
    );

    return deletedBranch;
  }
}

module.exports = BranchService;
