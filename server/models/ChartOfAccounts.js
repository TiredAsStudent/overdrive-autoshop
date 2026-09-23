const { query } = require("../config/db");

class ChartOfAccounts {
  static async checkDuplicate(accountCode, accountName, excludeId = null) {
    let sql = `SELECT id, account_code, account_name FROM chart_of_accounts WHERE (account_code = $1 OR account_name ILIKE $2)`;
    const params = [accountCode, accountName];

    if (excludeId) {
      sql += ` AND id != $3`;
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async create(data) {
    const sql = `
      INSERT INTO chart_of_accounts (
        account_code, account_name, account_type, parent_id, description, is_vat_applicable
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      data.account_code,
      data.account_name,
      data.account_type,
      data.parent_id || null,
      data.description || null,
      data.is_vat_applicable,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async update(id, data) {
    const setClauses = [];
    const values = [];
    let paramIdx = 1;

    const fields = [
      "account_name",
      "parent_id",
      "description",
      "is_vat_applicable",
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = $${paramIdx}`);
        values.push(data[field]);
        paramIdx++;
      }
    }

    if (setClauses.length === 0) {
      return (
        await query(`SELECT * FROM chart_of_accounts WHERE id = $1`, [id])
      ).rows[0];
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE chart_of_accounts SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async syncExpenseCategoryName(oldName, newName) {
    const sql = `UPDATE expenses SET category = $1, updated_at = NOW() WHERE category = $2`;
    await query(sql, [newName, oldName]);
  }

  static async toggleStatus(id, isActive) {
    const sql = `UPDATE chart_of_accounts SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const result = await query(sql, [isActive, id]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT c.*, p.account_name as parent_account_name 
      FROM chart_of_accounts c
      LEFT JOIN chart_of_accounts p ON c.parent_id = p.id
      WHERE c.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async countFiltered(search, type, status) {
    let sql = `SELECT COUNT(*) FROM chart_of_accounts`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(account_code ILIKE $${paramIdx} OR account_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (type && type !== "all") {
      conditions.push(`account_type = $${paramIdx}`);
      values.push(type.toUpperCase());
      paramIdx++;
    }
    if (status === "active") conditions.push(`is_active = TRUE`);
    else if (status === "inactive") conditions.push(`is_active = FALSE`);

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedFiltered(limit, offset, search, type, status) {
    let sql = `
      SELECT c.*, p.account_name as parent_account_name 
      FROM chart_of_accounts c
      LEFT JOIN chart_of_accounts p ON c.parent_id = p.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(c.account_code ILIKE $${paramIdx} OR c.account_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (type && type !== "all") {
      conditions.push(`c.account_type = $${paramIdx}`);
      values.push(type.toUpperCase());
      paramIdx++;
    }
    if (status === "active") conditions.push(`c.is_active = TRUE`);
    else if (status === "inactive") conditions.push(`c.is_active = FALSE`);

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY c.account_code ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  static async countAccountUsage(accountId) {
    try {
      const accRes = await query(
        `SELECT account_code, account_name FROM chart_of_accounts WHERE id = $1`,
        [accountId],
      );
      if (!accRes.rows[0]) return 0;
      const { account_code, account_name } = accRes.rows[0];

      const queries = [];

      queries.push(`
        SELECT COUNT(DISTINCT i.id) as cnt
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        JOIN services s ON ii.service_id = s.id
        WHERE s.income_account_id = $1
      `);

      queries.push(`
        SELECT COUNT(DISTINCT i.id) as cnt 
        FROM invoices i 
        JOIN invoice_items ii ON i.id = ii.invoice_id 
        JOIN inventory_items inv ON ii.item_id = inv.id
        WHERE ii.line_type = 'PART' AND inv.income_account_id = $1
      `);

      queries.push(`
        SELECT COUNT(*) as cnt 
        FROM inventory_movements im
        JOIN inventory_items inv ON im.item_id = inv.id
        WHERE inv.asset_account_id = $1
      `);

      queries.push(`
        SELECT COUNT(*) as cnt 
        FROM inventory_movements im
        JOIN inventory_items inv ON im.item_id = inv.id
        WHERE im.transaction_type = 'MANUAL_ADJUSTMENT' AND im.quantity_deducted > 0 AND inv.expense_account_id = $1
      `);

      queries.push(`
        SELECT COUNT(*) as cnt
        FROM expenses e
        WHERE e.category = $2 AND e.status = 'APPROVED'
      `);

      if (account_code === "1040") {
        queries.push(`SELECT COUNT(*) as cnt FROM invoices`);
        queries.push(
          `SELECT COUNT(*) as cnt FROM payments WHERE status != 'VOID'`,
        );
      }

      if (account_code === "2020") {
        queries.push(
          `SELECT COUNT(*) as cnt FROM invoices WHERE vat_amount > 0`,
        );
      }

      if (account_code === "1010") {
        queries.push(
          `SELECT COUNT(*) as cnt FROM payments WHERE payment_method = 'CASH' AND status != 'VOID'`,
        );
        queries.push(
          `SELECT COUNT(*) as cnt FROM vendor_payments WHERE payment_method = 'CASH' AND status != 'VOID'`,
        );
        queries.push(
          `SELECT COUNT(*) as cnt FROM expenses WHERE payment_method IN ('CASH', 'PETTY_CASH') AND status = 'APPROVED'`,
        );
      }

      if (account_code === "1020") {
        queries.push(
          `SELECT COUNT(*) as cnt FROM expenses WHERE vat_amount > 0 AND status = 'APPROVED'`,
        );
        queries.push(`SELECT COUNT(*) as cnt FROM bills WHERE vat_amount > 0`);
      }

      if (account_code === "1030") {
        queries.push(
          `SELECT COUNT(*) as cnt FROM payments WHERE payment_method IN ('GCASH', 'MAYA', 'BANK_TRANSFER') AND status != 'VOID'`,
        );
        queries.push(
          `SELECT COUNT(*) as cnt FROM vendor_payments WHERE payment_method IN ('CHECK', 'GCASH', 'MAYA', 'BANK_TRANSFER') AND status != 'VOID'`,
        );
        queries.push(
          `SELECT COUNT(*) as cnt FROM expenses WHERE payment_method IN ('GCASH', 'MAYA', 'BANK_TRANSFER', 'CHECK') AND status = 'APPROVED'`,
        );
      }

      if (account_code === "2010") {
        queries.push(`SELECT COUNT(*) as cnt FROM bills`);
        queries.push(
          `SELECT COUNT(*) as cnt FROM vendor_payments WHERE status != 'VOID'`,
        );
      }

      const sql =
        `SELECT SUM(cnt) as total FROM (` + queries.join(" UNION ALL ") + `) t`;
      const result = await query(sql, [accountId, account_name]);

      return parseInt(result.rows[0].total || 0, 10);
    } catch (error) {
      console.error("Account Usage Count Error:", error.message);
      return 0;
    }
  }

  static async getAccountUsage(accountId, limit, offset) {
    try {
      const accRes = await query(
        `SELECT account_code, account_name FROM chart_of_accounts WHERE id = $1`,
        [accountId],
      );
      if (!accRes.rows[0]) return [];
      const { account_code, account_name } = accRes.rows[0];

      const queries = [];
      const params = [accountId, account_name];

      queries.push(`
        SELECT 'INVOICE (Service Revenue)' as transaction_type, i.invoice_number as reference, i.created_at as transaction_date, 
        SUM(ii.recorded_selling_price * ii.quantity - ii.discount_amount) as amount, i.status::text as status
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        JOIN services s ON ii.service_id = s.id
        WHERE s.income_account_id = $1
        GROUP BY i.id, i.invoice_number, i.created_at, i.status
      `);

      queries.push(`
        SELECT 'INVOICE (Parts Revenue)' as transaction_type, i.invoice_number as reference, i.created_at as transaction_date, 
        SUM(ii.recorded_selling_price * ii.quantity - ii.discount_amount) as amount, i.status::text as status
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        JOIN inventory_items inv ON ii.item_id = inv.id
        WHERE ii.line_type = 'PART' AND inv.income_account_id = $1
        GROUP BY i.id, i.invoice_number, i.created_at, i.status
      `);

      queries.push(`
        SELECT 'INVENTORY (Asset)' as transaction_type, im.transaction_reference as reference, im.created_at as transaction_date, 
        ((im.quantity_added - im.quantity_deducted) * im.recorded_unit_cost) as amount, 
        im.transaction_type::text as status
        FROM inventory_movements im
        JOIN inventory_items inv ON im.item_id = inv.id
        WHERE inv.asset_account_id = $1
      `);

      queries.push(`
        SELECT 'INVENTORY (Adjustment)' as transaction_type, im.transaction_reference as reference, im.created_at as transaction_date, 
        ((im.quantity_deducted - im.quantity_added) * im.recorded_unit_cost) as amount, 
        COALESCE(im.adjustment_reason::text, im.transaction_type::text) as status
        FROM inventory_movements im
        JOIN inventory_items inv ON im.item_id = inv.id
        WHERE im.transaction_type = 'MANUAL_ADJUSTMENT' AND inv.expense_account_id = $1
      `);

      queries.push(`
        SELECT 'EXPENSE' as transaction_type, e.expense_number as reference, e.expense_date as transaction_date, 
        e.total_amount as amount, e.status::text as status
        FROM expenses e
        WHERE e.category = $2 AND e.status = 'APPROVED'
      `);

      if (account_code === "1040") {
        queries.push(`
           SELECT 'A/R (Invoice)' as transaction_type, invoice_number as reference, created_at as transaction_date, 
           grand_total as amount, status::text as status
           FROM invoices
         `);
        queries.push(`
           SELECT 'A/R (Liquidation)' as transaction_type, payment_number as reference, payment_date as transaction_date, 
           amount_received as amount, status::text as status
           FROM payments WHERE status != 'VOID'
         `);
      }

      if (account_code === "2020") {
        queries.push(`
           SELECT 'OUTPUT VAT' as transaction_type, invoice_number as reference, created_at as transaction_date, 
           vat_amount as amount, status::text as status
           FROM invoices WHERE vat_amount > 0
         `);
      }

      if (account_code === "1010") {
        queries.push(`
           SELECT 'PAYMENT (Cash Inflow)' as transaction_type, payment_number as reference, payment_date as transaction_date, 
           amount_received as amount, status::text as status
           FROM payments WHERE payment_method = 'CASH' AND status != 'VOID'
         `);
        queries.push(`
           SELECT 'DISBURSEMENT (Cash Outflow)' as transaction_type, payment_number as reference, payment_date as transaction_date, 
           amount_paid as amount, status::text as status
           FROM vendor_payments WHERE payment_method = 'CASH' AND status != 'VOID'
         `);
        queries.push(`
           SELECT 'EXPENSE (Cash Outflow)' as transaction_type, expense_number as reference, expense_date as transaction_date, 
           total_amount as amount, status::text as status
           FROM expenses WHERE payment_method IN ('CASH', 'PETTY_CASH') AND status = 'APPROVED'
         `);
      }

      if (account_code === "1020") {
        queries.push(`
           SELECT 'INPUT VAT (Operational Expense)' as transaction_type, expense_number as reference, expense_date as transaction_date, 
           vat_amount as amount, status::text as status
           FROM expenses WHERE vat_amount > 0 AND status = 'APPROVED'
         `);
        queries.push(`
           SELECT 'INPUT VAT (Supplier Bill)' as transaction_type, bill_number as reference, bill_date as transaction_date, 
           vat_amount as amount, status::text as status
           FROM bills WHERE vat_amount > 0
         `);
      }

      if (account_code === "1030") {
        queries.push(`
           SELECT 'PAYMENT (Bank/E-Wallet Inflow)' as transaction_type, payment_number as reference, payment_date as transaction_date, 
           amount_received as amount, status::text as status
           FROM payments WHERE payment_method IN ('GCASH', 'MAYA', 'BANK_TRANSFER') AND status != 'VOID'
         `);
        queries.push(`
           SELECT 'DISBURSEMENT (Bank/E-Wallet Outflow)' as transaction_type, payment_number as reference, payment_date as transaction_date, 
           amount_paid as amount, status::text as status
           FROM vendor_payments WHERE payment_method IN ('CHECK', 'GCASH', 'MAYA', 'BANK_TRANSFER') AND status != 'VOID'
         `);
        queries.push(`
           SELECT 'EXPENSE (Bank/E-Wallet Outflow)' as transaction_type, expense_number as reference, expense_date as transaction_date, 
           total_amount as amount, status::text as status
           FROM expenses WHERE payment_method IN ('GCASH', 'MAYA', 'BANK_TRANSFER', 'CHECK') AND status = 'APPROVED'
         `);
      }

      if (account_code === "2010") {
        queries.push(`
           SELECT 'SUPPLIER BILL (A/P Liability)' as transaction_type, bill_number as reference, created_at as transaction_date, 
           grand_total as amount, status::text as status
           FROM bills
         `);
        queries.push(`
           SELECT 'VENDOR PAYMENT (A/P Liquidation)' as transaction_type, payment_number as reference, payment_date as transaction_date, 
           amount_paid as amount, status::text as status
           FROM vendor_payments WHERE status != 'VOID'
         `);
      }

      const sql =
        queries.join(" UNION ALL ") +
        ` ORDER BY transaction_date DESC LIMIT $3 OFFSET $4`;
      params.push(limit, offset);

      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      console.error("Account Usage Fetch Error:", error.message);
      return [];
    }
  }
}

module.exports = ChartOfAccounts;
