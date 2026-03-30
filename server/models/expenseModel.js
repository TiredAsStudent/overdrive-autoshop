const db = require("../config/db");

class ExpenseModel {
  static async getCategories(client = db) {
    const query = `SELECT id, name FROM expense_categories WHERE is_active = TRUE ORDER BY id ASC;`;
    const result = await client.query(query);
    return result.rows;
  }

  static async createPendingExpense(
    branchId,
    staffId,
    expenseData,
    imageUrl,
    client = db,
  ) {
    const query = `
      INSERT INTO expenses (branch_id, uploaded_by, category_id, vendor_name, receipt_date, invoice_number, total_amount, receipt_image_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING_APPROVAL')
      RETURNING *;
    `;
    const values = [
      branchId,
      staffId,
      expenseData.categoryId,
      expenseData.vendorName,
      expenseData.receiptDate,
      expenseData.invoiceNumber,
      expenseData.totalAmount,
      imageUrl || null,
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  }

  static async addExpenseLineItem(expenseId, item, client = db) {
    const query = `
      INSERT INTO expense_line_items (expense_id, item_name, quantity, unit_cost, subtotal)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      expenseId,
      item.itemName,
      item.quantity,
      item.unitCost,
      item.subtotal,
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  }

  // --- ADMIN CHECKER METHODS ---

  // Fetch the Master Approval Queue
  static async getPendingExpenses(branchId, client = db) {
    const query = `
      SELECT 
        e.*, 
        c.name as category_name,
        u.first_name as uploaded_by_name
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.uploaded_by = u.id
      WHERE e.branch_id = $1 AND e.status = 'PENDING_APPROVAL'
      ORDER BY e.created_at ASC;
    `;
    const result = await client.query(query, [branchId]);
    return result.rows;
  }

  // Fetch a single expense with its line items
  static async getExpenseWithDetails(expenseId, branchId, client = db) {
    const headerQuery = `
      SELECT e.*, c.name as category_name 
      FROM expenses e 
      JOIN expense_categories c ON e.category_id = c.id
      WHERE e.id = $1 AND e.branch_id = $2;
    `;
    const headerResult = await client.query(headerQuery, [expenseId, branchId]);
    if (headerResult.rows.length === 0) return null;

    const expense = headerResult.rows[0];

    const itemsQuery = `SELECT * FROM expense_line_items WHERE expense_id = $1 ORDER BY id ASC;`;
    const itemsResult = await client.query(itemsQuery, [expenseId]);

    expense.items = itemsResult.rows;
    return expense;
  }

  //Update the Status (Approve/Reject)
  static async updateExpenseStatus(expenseId, status, client = db) {
    const query = `
      UPDATE expenses 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *;
    `;
    const result = await client.query(query, [status, expenseId]);
    return result.rows[0];
  }

  // Link the OCR text to the actual DB Part ID
  static async updateLineItemMasterPart(lineItemId, masterPartId, client = db) {
    const query = `
      UPDATE expense_line_items
      SET master_part_id = $1
      WHERE id = $2 RETURNING *;
    `;
    const result = await client.query(query, [masterPartId, lineItemId]);
    return result.rows[0];
  }
}

module.exports = ExpenseModel;
