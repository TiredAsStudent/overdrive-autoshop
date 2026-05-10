const { pool, query } = require("../config/db");

class Expense {
  // Fetch pending expenses for the Split-Screen UI
  static async getPending(branchId) {
    let sql = `
      SELECT e.*, s.supplier_name, u.first_name || ' ' || u.last_name as staff_name
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      JOIN users u ON e.submitted_by = u.id
      WHERE e.status = 'PENDING'
    `;
    const values = [];
    if (branchId) {
      sql += ` AND e.branch_id = $1`;
      values.push(branchId);
    }
    sql += ` ORDER BY e.created_at ASC`; // Oldest first
    const result = await query(sql, values);
    return result.rows;
  }

  // Duplicate Check Logic
  static async checkDuplicate(supplierId, date, totalAmount) {
    const sql = `
      SELECT id FROM expenses 
      WHERE supplier_id = $1 AND transaction_date = $2 AND total_amount = $3 AND status = 'APPROVED'
    `;
    const result = await query(sql, [supplierId, date, totalAmount]);
    return result.rows.length > 0;
  }

  // The Grand Atomic Transaction (All-or-Nothing)
  static async approveAtomic(expenseId, data, branchId) {
    const client = await pool.connect(); // Grab a dedicated connection
    try {
      await client.query("BEGIN"); // Lock the database state

      // 1. Mark Expense as Approved & Update verified totals
      const updateExpSql = `
        UPDATE expenses 
        SET status = 'APPROVED', base_amount = $1, vat_amount = $2, total_amount = $3, supplier_id = $4, updated_at = NOW()
        WHERE id = $5 RETURNING transaction_date
      `;
      const expRes = await client.query(updateExpSql, [
        data.base_amount,
        data.vat_amount,
        data.total_amount,
        data.supplier_id,
        expenseId,
      ]);
      const txnDate = expRes.rows[0].transaction_date;

      // 2. Post to VAT Ledger (If VAT exists)
      if (data.vat_amount > 0) {
        const taxPeriod = txnDate.toISOString().slice(0, 7); // Format: YYYY-MM
        const vatSql = `
          INSERT INTO vat_ledger (transaction_date, branch_id, transaction_type, base_amount, vat_amount, total_amount, reference_type, reference_id, tax_period)
          VALUES ($1, $2, 'INPUT', $3, $4, $5, 'SUPPLIER_RECEIPT', $6, $7)
        `;
        await client.query(vatSql, [
          txnDate,
          branchId,
          data.base_amount,
          data.vat_amount,
          data.total_amount,
          expenseId,
          taxPeriod,
        ]);
      }

      // 3. Post to General Ledger (Double Entry Accounting)
      // Debit: The Expense/Asset Account (e.g., Shop Utilities or Inventory Asset)
      await client.query(
        `
        INSERT INTO general_ledger (branch_id, transaction_date, account_id, debit, reference_type, reference_id)
        VALUES ($1, $2, (SELECT id FROM chart_of_accounts WHERE account_code = $3::text LIMIT 1), $4, 'EXPENSE_RECEIPT', $5)
      `,
        [
          branchId,
          txnDate,
          data.expense_account_id.toString(),
          data.base_amount,
          expenseId,
        ],
      );

      // Debit: Input VAT (Account 1300 or similar, assuming standard setup)
      if (data.vat_amount > 0) {
        // NOTE: In production, fetch the exact Input VAT account ID. Hardcoding for example logic.
        await client.query(
          `
          INSERT INTO general_ledger (branch_id, transaction_date, account_id, debit, reference_type, reference_id)
          VALUES ($1, $2, (SELECT id FROM chart_of_accounts WHERE account_name ILIKE '%Input VAT%' LIMIT 1), $3, 'EXPENSE_RECEIPT', $4)
        `,
          [branchId, txnDate, data.vat_amount, expenseId],
        );
      }

      // Credit: Accounts Payable (Account 2000)
      await client.query(
        `
        INSERT INTO general_ledger (branch_id, transaction_date, account_id, credit, reference_type, reference_id)
        VALUES ($1, $2, (SELECT id FROM chart_of_accounts WHERE account_code = '2000' LIMIT 1), $3, 'EXPENSE_RECEIPT', $4)
      `,
        [branchId, txnDate, data.total_amount, expenseId],
      );

      // 4. Update Inventory & Moving Average Cost (If Line Items exist)
      if (data.items && data.items.length > 0) {
        for (let item of data.items) {
          // Update Branch Quantity
          await client.query(
            `
            UPDATE branch_inventory SET quantity = quantity + $1, last_restock_date = NOW()
            WHERE branch_id = $2 AND item_id = $3
          `,
            [item.quantity, branchId, item.inventory_item_id],
          );

          // Moving Average Cost Calculation Formula
          await client.query(
            `
            UPDATE inventory_items 
            SET unit_cost = ((unit_cost * (SELECT COALESCE(SUM(quantity), 0) FROM branch_inventory WHERE item_id = $1)) + ($2 * $3)) / 
                            ((SELECT COALESCE(SUM(quantity), 0) FROM branch_inventory WHERE item_id = $1) + $2)
            WHERE id = $1
          `,
            [item.inventory_item_id, item.quantity, item.unit_price],
          );
        }
      }

      await client.query("COMMIT"); // EVERYTHING SUCCEEDS
      return true;
    } catch (error) {
      await client.query("ROLLBACK"); // EVERYTHING REVERTS
      throw error;
    } finally {
      client.release(); // Return connection to pool
    }
  }

  // Reject an expense back to staff
  static async reject(expenseId, reason, category) {
    const sql = `
      UPDATE expenses 
      SET status = 'REJECTED', rejection_reason = $1, rejection_category = $2, updated_at = NOW()
      WHERE id = $3 RETURNING *
    `;
    const result = await query(sql, [reason, category, expenseId]);
    return result.rows[0];
  }

  // Fetch permanent archive of rejected expenses
  static async getRejectedLogs(branchId) {
    let sql = `
      SELECT e.*, s.supplier_name, u.first_name || ' ' || u.last_name as staff_name
      FROM expenses e
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      JOIN users u ON e.submitted_by = u.id
      WHERE e.status = 'REJECTED'
    `;
    const values = [];
    if (branchId) {
      sql += ` AND e.branch_id = $1`;
      values.push(branchId);
    }
    sql += ` ORDER BY e.updated_at DESC`; // Show most recently rejected first
    const result = await query(sql, values);
    return result.rows;
  }

  static async create(data) {
    const sql = `
      INSERT INTO expenses (
        branch_id, submitted_by, supplier_id, transaction_date, 
        base_amount, vat_amount, total_amount, 
        receipt_image_url, ai_confidence_score, status
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
      RETURNING *;
    `;
    const values = [
      data.branch_id,
      data.submitted_by,
      data.supplier_id || null,
      data.transaction_date,
      data.base_amount,
      data.vat_amount,
      data.total_amount,
      data.receipt_image_url,
      data.ai_confidence_score || 1.0,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }
}

module.exports = Expense;
