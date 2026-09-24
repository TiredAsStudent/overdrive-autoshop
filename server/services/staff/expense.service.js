const ExpenseModel = require("../../models/Expense");
const SystemSetting = require("../../models/SystemSetting");
const VendorModel = require("../../models/Vendor");
const { logSecureAction } = require("../../utils/auditLogger");
const fs = require("fs").promises;
const path = require("path");

class ExpenseService {
  static async _calculateTaxes(totalAmount, isVatable) {
    const numericTotal = parseFloat(totalAmount);
    const booleanVatable = String(isVatable) === "true";

    if (!booleanVatable) {
      return {
        subtotal: parseFloat(numericTotal.toFixed(2)),
        vat_amount: 0.0,
        total_amount: parseFloat(numericTotal.toFixed(2)),
      };
    }

    const settings = await SystemSetting.getSettings();
    const vatPercentage = parseFloat(settings.vat_percentage);
    const vatDivisor = 1 + vatPercentage / 100; // e.g., 1.12

    const subtotal = numericTotal / vatDivisor;
    const vatAmount = numericTotal - subtotal;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      vat_amount: parseFloat(vatAmount.toFixed(2)),
      total_amount: parseFloat(numericTotal.toFixed(2)),
    };
  }

  static async createExpense(data, activeUser, ipAddress, file) {
    const branchId = activeUser.branchId;

    try {
      if (!branchId) throw new Error("System Error: Branch context missing.");

      const parsedTotalAmount = parseFloat(data.total_amount);
      const parsedIsVatable = String(data.is_vatable) === "true";
      const parsedIsSubmitting = String(data.is_submitting) === "true";

      const parsedVendorId =
        data.vendor_id &&
        data.vendor_id !== "null" &&
        data.vendor_id !== "undefined"
          ? parseInt(data.vendor_id, 10)
          : null;
      const parsedVendorName =
        data.vendor_name &&
        data.vendor_name !== "null" &&
        data.vendor_name !== "undefined"
          ? data.vendor_name.trim()
          : null;
      const parsedRefNumber =
        data.reference_number &&
        data.reference_number !== "null" &&
        data.reference_number !== "undefined"
          ? data.reference_number.trim()
          : null;
      const parsedNotes =
        data.notes && data.notes !== "null" && data.notes !== "undefined"
          ? data.notes.trim()
          : null;

      if (parsedVendorId) {
        const vendor = await VendorModel.findById(parsedVendorId);
        if (!vendor || !vendor.is_active)
          throw new Error("The selected vendor is invalid or inactive.");
      }

      const financials = await this._calculateTaxes(
        parsedTotalAmount,
        parsedIsVatable,
      );

      const payload = {
        branch_id: branchId,
        vendor_id: parsedVendorId,
        vendor_name: parsedVendorName,
        expense_account_id: parseInt(data.expense_account_id, 10),
        description: data.description,
        reference_number: parsedRefNumber,
        expense_date: data.expense_date,
        is_vatable: parsedIsVatable,
        payment_method: data.payment_method,
        notes: parsedNotes,
        created_by: activeUser.id,
        status: parsedIsSubmitting ? "PENDING_APPROVAL" : "DRAFT",
        ...financials,
      };

      if (file) {
        payload.receipt_url = file.path.replace(/\\/g, "/");
      }

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
              `Reference number '${parsedRefNumber}' already exists for this vendor.`,
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
          has_attachment: !!payload.receipt_url,
        },
      );

      return newExpense;
    } catch (error) {
      if (file) await fs.unlink(file.path).catch(console.error);
      throw error;
    }
  }

  static async updateExpense(id, data, activeUser, ipAddress, file) {
    try {
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

      const parsedIsVatable =
        data.is_vatable !== undefined
          ? String(data.is_vatable) === "true"
          : oldExpense.is_vatable;
      const parsedTotalAmount =
        data.total_amount !== undefined
          ? parseFloat(data.total_amount)
          : parseFloat(oldExpense.total_amount);
      const parsedIsSubmitting = String(data.is_submitting) === "true";
      const parsedRemoveAttachment = String(data.remove_attachment) === "true";

      let parsedVendorId = oldExpense.vendor_id;
      if (data.vendor_id !== undefined) {
        parsedVendorId =
          data.vendor_id &&
          data.vendor_id !== "null" &&
          data.vendor_id !== "undefined"
            ? parseInt(data.vendor_id, 10)
            : null;
      }

      const parsedVendorName =
        data.vendor_name !== undefined
          ? data.vendor_name &&
            data.vendor_name !== "null" &&
            data.vendor_name !== "undefined"
            ? data.vendor_name.trim()
            : null
          : oldExpense.vendor_name;
      const parsedRefNumber =
        data.reference_number !== undefined
          ? data.reference_number &&
            data.reference_number !== "null" &&
            data.reference_number !== "undefined"
            ? data.reference_number.trim()
            : null
          : oldExpense.reference_number;
      const parsedNotes =
        data.notes !== undefined
          ? data.notes && data.notes !== "null" && data.notes !== "undefined"
            ? data.notes.trim()
            : null
          : oldExpense.notes;

      let financials = {
        subtotal: parseFloat(oldExpense.subtotal),
        vat_amount: parseFloat(oldExpense.vat_amount),
        total_amount: parseFloat(oldExpense.total_amount),
      };

      if (data.total_amount !== undefined || data.is_vatable !== undefined) {
        financials = await this._calculateTaxes(
          parsedTotalAmount,
          parsedIsVatable,
        );
      }

      const payload = {
        ...data,
        expense_account_id:
          data.expense_account_id !== undefined
            ? parseInt(data.expense_account_id, 10)
            : oldExpense.expense_account_id,
        vendor_id: parsedVendorId,
        vendor_name: parsedVendorName,
        reference_number: parsedRefNumber,
        notes: parsedNotes,
        is_vatable: parsedIsVatable,
        total_amount: parsedTotalAmount,
        ...financials,
        status: parsedIsSubmitting ? "PENDING_APPROVAL" : oldExpense.status,
      };

      if (file) {
        payload.receipt_url = file.path.replace(/\\/g, "/");

        if (oldExpense.receipt_url && !oldExpense.scan_id) {
          try {
            await fs.unlink(path.resolve(oldExpense.receipt_url));
          } catch (err) {
            console.warn(
              "Could not delete replaced expense attachment:",
              err.message,
            );
          }
        }
      } else if (parsedRemoveAttachment) {
        payload.receipt_url = null;

        if (oldExpense.receipt_url && !oldExpense.scan_id) {
          try {
            await fs.unlink(path.resolve(oldExpense.receipt_url));
          } catch (err) {
            console.warn(
              "Could not delete removed expense attachment:",
              err.message,
            );
          }
        }
      }

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
            `Reference number '${parsedRefNumber}' already exists for this vendor.`,
          );
        }
        throw error;
      }
    } catch (error) {
      if (file) await fs.unlink(file.path).catch(console.error);
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
    expenseAccountId = "all",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, expenses] = await Promise.all([
      ExpenseModel.countFiltered(search, status, expenseAccountId, branchId),
      ExpenseModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        status,
        expenseAccountId,
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
