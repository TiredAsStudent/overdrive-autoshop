const AccountModel = require("../models/Account");
const { logSecureAction } = require("../utils/auditLogger");

class BillingService {
  static async createCategory(data, userId, ipAddress) {
    // Note: Assuming these methods exist in a CategoryModel extension or similar
    const existing = await AccountModel.findCategoryByName(data.name);
    if (existing) {
      throw new Error("An account category with this name already exists.");
    }

    const newCategory = await AccountModel.createCategory(data);

    await logSecureAction(
      userId,
      null,
      "CREATE_ACCOUNT_CATEGORY",
      "INFO",
      ipAddress,
      "account_categories",
      newCategory.id,
      null,
      data,
    );

    return newCategory;
  }

  static async getCategories(typeFilter) {
    return await AccountModel.getAllCategories(typeFilter);
  }

  static async updateCategory(id, updates, userId, ipAddress) {
    const existing = await AccountModel.findCategoryById(id);
    if (!existing) {
      throw new Error("Category not found.");
    }

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

    const safeUpdates = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.description !== undefined)
      safeUpdates.description = updates.description;
    if (updates.is_active !== undefined)
      safeUpdates.is_active = updates.is_active;

    if (Object.keys(safeUpdates).length === 0) {
      throw new Error("No valid fields provided for update.");
    }

    const updatedCategory = await AccountModel.updateCategory(id, safeUpdates);

    await logSecureAction(
      userId,
      null,
      "UPDATE_ACCOUNT_CATEGORY",
      "WARNING",
      ipAddress,
      "account_categories",
      id,
      existing,
      safeUpdates,
    );

    return updatedCategory;
  }

  static async getRealTimeBalances(branchId) {
    return await AccountModel.getRealTimeBalances(branchId);
  }
}

module.exports = BillingService;
