const db = require("../config/db");
const ExpenseModel = require("../models/expenseModel");
const AuditModel = require("../models/auditModel");
const InventoryModel = require("../models/inventoryModel");
const OcrProcessor = require("../utils/ocrProcessor");

class ExpenseService {
  static async processReceiptUpload(file) {
    if (!file) throw new Error("No receipt image provided.");
    // Triggers the Image Cleaning + Tesseract OCR
    return await OcrProcessor.extract(file.buffer, file.originalname);
  }

  static async savePendingExpense(staffId, branchId, mappedData, ipAddress) {
    const {
      categoryId,
      vendorName,
      receiptDate,
      invoiceNumber,
      totalAmount,
      items,
      processedImageUrl,
    } = mappedData;

    if (!categoryId || !vendorName || totalAmount === undefined) {
      throw new Error(
        "Missing required expense data. Category, Vendor, and Total are required.",
      );
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Save the main receipt to the Waiting Room (PENDING_APPROVAL)
      const expense = await ExpenseModel.createPendingExpense(
        branchId,
        staffId,
        mappedData,
        processedImageUrl,
        client,
      );

      // Save the mapped Line Items
      const savedItems = [];
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const qty = Number(item.quantity) || 1;
          const cost = Number(item.unitCost) || 0;
          const subtotal = qty * cost;

          const savedItem = await ExpenseModel.addExpenseLineItem(
            expense.id,
            {
              itemName: item.itemName,
              quantity: qty,
              unitCost: cost,
              subtotal,
            },
            client,
          );
          savedItems.push(savedItem);
        }
      }

      // Maker Audit Trail
      await AuditModel.log(
        staffId,
        branchId,
        "SUBMITTED_EXPENSE_FOR_APPROVAL",
        "expenses",
        expense.id,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return { ...expense, items: savedItems };
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(error.message);
    } finally {
      client.release();
    }
  }

  static async getCategories() {
    return await ExpenseModel.getCategories();
  }

  // --- ADMIN CHECKER ENGINE ---
  static async getPendingApprovalQueue(branchId) {
    return await ExpenseModel.getPendingExpenses(branchId);
  }

  static async getExpenseDetails(expenseId, branchId) {
    return await ExpenseModel.getExpenseWithDetails(expenseId, branchId);
  }

  // THE DOUBLE-ACTION TRIGGER (Approve, Restock, & Markup)
  static async approveExpense(
    adminId,
    branchId,
    expenseId,
    mappedItems,
    ipAddress,
  ) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Fetch and Validate
      const expense = await ExpenseModel.getExpenseWithDetails(
        expenseId,
        branchId,
        client,
      );
      if (!expense) throw new Error("Expense not found.");
      if (expense.status !== "PENDING_APPROVAL")
        throw new Error("This expense is not pending approval.");

      // Action A: The Ledger (Update Status to APPROVED)
      const approvedExpense = await ExpenseModel.updateExpenseStatus(
        expenseId,
        "APPROVED",
        client,
      );

      // Action B: The Restock & Dynamic Markup (If Category is 'Inventory Parts')
      if (expense.category_name === "Inventory Parts") {
        // mappedItems is an array from frontend: [{ lineItemId: 1, masterPartId: 4 }]
        if (!mappedItems || mappedItems.length === 0) {
          throw new Error(
            "You must map the OCR items to Master Inventory parts to approve a restock.",
          );
        }

        for (const item of expense.items) {
          // Find the matching mapping from the Admin's frontend review
          const mapping = mappedItems.find((m) => m.lineItemId === item.id);
          if (mapping && mapping.masterPartId) {
            // Link the record for historical accuracy
            await ExpenseModel.updateLineItemMasterPart(
              item.id,
              mapping.masterPartId,
              client,
            );

            // Add Stock to the Shelves
            await InventoryModel.addStockUpsert(
              branchId,
              mapping.masterPartId,
              item.quantity,
              client,
            );

            // The Dynamic Markup Engine
            // Calculate a new suggested retail price (e.g., Cost + 35% margin)
            const newUnitCost = Number(item.unit_cost);
            const suggestedRetailPrice = Math.ceil(newUnitCost * 1.35);

            // Update the master catalog with the new supplier cost and retail price
            const updateCostQuery = `
              UPDATE master_inventory 
              SET unit_cost = $1, retail_price = $2, updated_at = NOW() 
              WHERE id = $3
            `;
            await client.query(updateCostQuery, [
              newUnitCost,
              suggestedRetailPrice,
              mapping.masterPartId,
            ]);
          }
        }
      }

      // Leave an Audit Trail
      await AuditModel.log(
        adminId,
        branchId,
        "APPROVED_OCR_EXPENSE_AND_RESTOCKED",
        "expenses",
        expenseId,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return approvedExpense;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(error.message);
    } finally {
      client.release();
    }
  }

  static async rejectExpense(adminId, branchId, expenseId, ipAddress) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const rejected = await ExpenseModel.updateExpenseStatus(
        expenseId,
        "REJECTED",
        client,
      );
      await AuditModel.log(
        adminId,
        branchId,
        "REJECTED_OCR_EXPENSE",
        "expenses",
        expenseId,
        ipAddress,
        client,
      );
      await client.query("COMMIT");
      return rejected;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(error.message);
    } finally {
      client.release();
    }
  }
}

module.exports = ExpenseService;
