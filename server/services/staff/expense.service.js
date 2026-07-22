const ExpenseModel = require("../../models/Expense");
const SystemSetting = require("../../models/SystemSetting");
const VendorModel = require("../../models/Vendor");
const { logSecureAction } = require("../../utils/auditLogger");

class ExpenseService {
  static async _calculateTaxes(totalAmount, isVatable) {
    if (!isVatable) {
      return {
        subtotal: parseFloat(totalAmount.toFixed(2)),
        vat_amount: 0.0,
        total_amount: parseFloat(totalAmount.toFixed(2)),
      };
    }

    const settings = await SystemSetting.getSettings();
    const vatPercentage = parseFloat(settings.vat_percentage);
    const vatDivisor = 1 + vatPercentage / 100; // e.g., 1.12

    const subtotal = totalAmount / vatDivisor;
    const vatAmount = totalAmount - subtotal;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      vat_amount: parseFloat(vatAmount.toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2)),
    };
  }

  static async createExpense(data, activeUser, ipAddress) {
    const branchId = activeUser.branchId;
    if (!branchId) throw new Error("System Error: Branch context missing.");

    if (data.vendor_id) {
      const vendor = await VendorModel.findById(data.vendor_id);
      if (!vendor || !vendor.is_active)
        throw new Error("The selected vendor is invalid or inactive.");
    }

    // Process Financials (VR-06 compliance)
    const financials = await this._calculateTaxes(
      data.total_amount,
      data.is_vatable,
    );

    const payload = {
      branch_id: branchId,
      vendor_id: data.vendor_id || null,
      category: data.category,
      description: data.description,
      reference_number: data.reference_number || null,
      expense_date: data.expense_date,
      is_vatable: data.is_vatable,
      payment_method: data.payment_method,
      notes: data.notes || null,
      created_by: activeUser.id,
      status: data.is_submitting ? "PENDING_APPROVAL" : "DRAFT",
      ...financials,
    };

    let retries = 3;
    let newExpense = null;

    while (retries > 0) {
      try {
        payload.expense_number = await ExpenseModel.generateExpenseCode();
        newExpense = await ExpenseModel.create(payload);
        break;
      } catch (error) {
        if (
          error.code === "23505" &&
          error.constraint === "idx_unique_expense_ref"
        ) {
          throw new Error(
            `Reference number '${data.reference_number}' already exists for this vendor.`,
          );
        }
        if (
          error.code === "23505" &&
          error.constraint === "expenses_expense_number_key"
        ) {
          retries--;
          if (retries === 0)
            throw new Error(
              "High traffic. Failed to generate a unique Expense code.",
            );
        } else {
          throw error;
        }
      }
    }

    await logSecureAction(
      activeUser.id,
      branchId,
      "MANUAL_EXPENSE_RECORDED",
      "INFO",
      ipAddress,
      "expenses",
      newExpense.id,
      null,
      {
        expense_number: newExpense.expense_number,
        status: newExpense.status,
        total: newExpense.total_amount,
      },
    );

    return newExpense;
  }

  static async updateExpense(id, data, activeUser, ipAddress) {
    const oldExpense = await ExpenseModel.findById(id);
    if (!oldExpense) throw new Error("Expense record not found.");

    if (
      activeUser.role === "STAFF" &&
      oldExpense.branch_id !== activeUser.branchId
    ) {
      throw new Error(
        "Unauthorized: Cannot modify a document outside your branch.",
      );
    }

    if (!["DRAFT", "REJECTED"].includes(oldExpense.status)) {
      throw new Error(
        `Document Locked: You cannot modify an expense that is currently ${oldExpense.status}.`,
      );
    }

    let financials = {
      subtotal: oldExpense.subtotal,
      vat_amount: oldExpense.vat_amount,
      total_amount: oldExpense.total_amount,
    };

    const isVatableUpdated =
      data.is_vatable !== undefined ? data.is_vatable : oldExpense.is_vatable;
    const amountUpdated =
      data.total_amount !== undefined
        ? data.total_amount
        : oldExpense.total_amount;

    if (data.total_amount !== undefined || data.is_vatable !== undefined) {
      financials = await this._calculateTaxes(amountUpdated, isVatableUpdated);
    }

    const payload = {
      ...data,
      ...financials,
      status: data.is_submitting ? "PENDING_APPROVAL" : oldExpense.status, // Re-trigger approval if needed
    };

    try {
      const updatedExpense = await ExpenseModel.update(id, payload);

      await logSecureAction(
        activeUser.id,
        oldExpense.branch_id,
        "MANUAL_EXPENSE_UPDATED",
        "INFO",
        ipAddress,
        "expenses",
        id,
        { total: oldExpense.total_amount, status: oldExpense.status },
        { total: updatedExpense.total_amount, status: updatedExpense.status },
      );

      return updatedExpense;
    } catch (error) {
      if (
        error.code === "23505" &&
        error.constraint === "idx_unique_expense_ref"
      ) {
        throw new Error(
          `Reference number '${data.reference_number}' already exists for this vendor.`,
        );
      }
      throw error;
    }
  }

  static async updateStatus(id, newStatus, activeUser, ipAddress) {
    const expense = await ExpenseModel.findById(id);
    if (!expense) throw new Error("Expense record not found.");

    if (
      activeUser.role === "STAFF" &&
      expense.branch_id !== activeUser.branchId
    ) {
      throw new Error("Unauthorized.");
    }

    if (
      newStatus === "PENDING_APPROVAL" &&
      !["DRAFT", "REJECTED"].includes(expense.status)
    ) {
      throw new Error(
        "Only Draft or Rejected expenses can be submitted for approval.",
      );
    }

    const updated = await ExpenseModel.update(id, { status: newStatus });

    await logSecureAction(
      activeUser.id,
      activeUser.branchId,
      "EXPENSE_STATUS_TRANSITION",
      "INFO",
      ipAddress,
      "expenses",
      id,
      { status: expense.status },
      { status: newStatus },
    );

    return updated;
  }

  static async getExpenseDetails(id, activeUser) {
    const expense = await ExpenseModel.findById(id);
    if (!expense) throw new Error("Expense record not found.");

    if (
      activeUser.role === "STAFF" &&
      expense.branch_id !== activeUser.branchId
    ) {
      throw new Error("Unauthorized: Cross-branch view restricted.");
    }
    return expense;
  }

  static async getExpenses(
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    category = "all",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, expenses] = await Promise.all([
      ExpenseModel.countFiltered(search, status, category, branchId),
      ExpenseModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        status,
        category,
        branchId,
      ),
    ]);

    return {
      expenses,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}

module.exports = ExpenseService;
