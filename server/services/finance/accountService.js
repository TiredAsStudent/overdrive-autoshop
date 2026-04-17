const AccountModel = require("../../models/finance/accountModel");

class AccountService {
  static async createCategory(data, userId, ipAddress) {
    // Prevent duplicate buckets
    const existing = await AccountModel.findCategoryByName(data.name);
    if (existing) {
      throw new Error("An account category with this name already exists.");
    }

    return await AccountModel.createCategoryAndLogAudit(
      data,
      userId,
      ipAddress,
    );
  }

  static async getCategories(typeFilter) {
    return await AccountModel.getAllCategories(typeFilter);
  }

  static async updateCategory(id, updates, userId, ipAddress) {
    const existing = await AccountModel.findCategoryById(id);
    if (!existing) {
      throw new Error("Category not found.");
    }

    // If changing name, ensure it doesn't conflict with another category
    if (
      updates.name &&
      updates.name.toLowerCase() !== existing.name.toLowerCase()
    ) {
      const duplicateCheck = await AccountModel.findCategoryByName(
        updates.name,
      );
      if (duplicateCheck) {
        throw new Error(
          "An account category with this new name already exists.",
        );
      }
    }

    // to prevent malicious column updates in the dynamic SQL.
    const safeUpdates = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.description !== undefined)
      safeUpdates.description = updates.description;
    if (updates.is_active !== undefined)
      safeUpdates.is_active = updates.is_active;

    // Check if there's actually anything to update
    if (Object.keys(safeUpdates).length === 0) {
      throw new Error("No valid fields provided for update.");
    }

    return await AccountModel.updateCategoryAndLogAudit(
      id,
      safeUpdates, // <-- Passing the sanitized object here
      userId,
      ipAddress,
    );
  }

  static async getRealTimeBalances(branchId) {
    return await AccountModel.getRealTimeBalances(branchId);
  }
}

module.exports = AccountService;
