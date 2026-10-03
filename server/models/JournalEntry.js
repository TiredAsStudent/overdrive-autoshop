const { query, pool } = require("../config/db");

class JournalEntry {
  static async generateJournalCode() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `JRN-${yearMonth}-`;

    const sql = `SELECT journal_number FROM journal_entries WHERE journal_number LIKE $1 ORDER BY id DESC LIMIT 1`;
    const result = await query(sql, [`${prefix}%`]);

    let sequence = 1;
    if (result.rows[0]) {
      const lastSequence = parseInt(
        result.rows[0].journal_number.split("-")[2],
        10,
      );
      sequence = lastSequence + 1;
    }
    return `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  static async validateNonSystemAccounts(items) {
    if (!items || items.length === 0) return;

    const accountIds = items.map((item) => parseInt(item.account_id, 10));

    const sql = `
      SELECT account_code, account_name 
      FROM chart_of_accounts 
      WHERE id = ANY($1::int[]) AND is_system = true
    `;

    const result = await query(sql, [accountIds]);

    if (result.rows.length > 0) {
      const systemAccounts = result.rows
        .map((r) => `[${r.account_code}] ${r.account_name}`)
        .join(", ");
      throw new Error(
        `Accounting Rule Violation: Manual journal entries cannot post to System Control Accounts (${systemAccounts}). Please use standard operational modules (Bills, Invoices, Payments) to affect these balances.`,
      );
    }
  }

  static async createTransaction(data, items, userId) {
    await this.validateNonSystemAccounts(items);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const journal_number = await this.generateJournalCode();

      const headerSql = `
        INSERT INTO journal_entries (
          journal_number, entry_date, reference_number, description, 
          total_amount, status, branch_id, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
      `;
      const headerValues = [
        journal_number,
        data.entry_date,
        data.reference_number || null,
        data.description,
        data.total_amount,
        data.status,
        data.branch_id || null,
        userId,
      ];
      const headerRes = await client.query(headerSql, headerValues);
      const newEntry = headerRes.rows[0];

      let itemSql = `INSERT INTO journal_entry_items (journal_entry_id, account_id, entry_type, amount, line_description) VALUES `;
      const itemValues = [];
      const placeholders = [];
      let paramIdx = 1;

      items.forEach((item) => {
        placeholders.push(
          `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4})`,
        );
        itemValues.push(
          newEntry.id,
          item.account_id,
          item.entry_type,
          item.amount,
          item.line_description || null,
        );
        paramIdx += 5;
      });

      itemSql += placeholders.join(", ");
      await client.query(itemSql, itemValues);

      await client.query("COMMIT");
      return newEntry;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateTransaction(id, data, items) {
    await this.validateNonSystemAccounts(items);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const headerSql = `
        UPDATE journal_entries 
        SET entry_date = $1, reference_number = $2, description = $3, total_amount = $4, status = $5, branch_id = $6, updated_at = NOW()
        WHERE id = $7 RETURNING *
      `;
      const headerRes = await client.query(headerSql, [
        data.entry_date,
        data.reference_number || null,
        data.description,
        data.total_amount,
        data.status,
        data.branch_id || null,
        id,
      ]);
      const updatedEntry = headerRes.rows[0];

      await client.query(
        `DELETE FROM journal_entry_items WHERE journal_entry_id = $1`,
        [id],
      );

      let itemSql = `INSERT INTO journal_entry_items (journal_entry_id, account_id, entry_type, amount, line_description) VALUES `;
      const itemValues = [];
      const placeholders = [];
      let paramIdx = 1;

      items.forEach((item) => {
        placeholders.push(
          `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4})`,
        );
        itemValues.push(
          id,
          item.account_id,
          item.entry_type,
          item.amount,
          item.line_description || null,
        );
        paramIdx += 5;
      });

      itemSql += placeholders.join(", ");
      await client.query(itemSql, itemValues);

      await client.query("COMMIT");
      return updatedEntry;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async deleteDraft(id) {
    const sql = `DELETE FROM journal_entries WHERE id = $1 AND status = 'DRAFT' RETURNING id`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT je.*, TO_CHAR(je.entry_date, 'YYYY-MM-DD') as entry_date, 
             u.first_name as created_by_name, b.branch_name
      FROM journal_entries je
      LEFT JOIN users u ON je.created_by = u.id
      LEFT JOIN branches b ON je.branch_id = b.id
      WHERE je.id = $1
    `;
    const result = await query(sql, [id]);
    const entry = result.rows[0];

    if (!entry) return null;

    const itemsSql = `
      SELECT ji.*, c.account_code, c.account_name, c.account_type 
      FROM journal_entry_items ji
      JOIN chart_of_accounts c ON ji.account_id = c.id
      WHERE ji.journal_entry_id = $1
      ORDER BY ji.entry_type DESC, ji.id ASC
    `;
    const itemsResult = await query(itemsSql, [id]);
    entry.items = itemsResult.rows;

    return entry;
  }

  static async countFiltered(search, status, branchId, startDate, endDate) {
    let sql = `SELECT COUNT(DISTINCT je.id) FROM journal_entries je`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(je.journal_number ILIKE $${paramIdx} OR je.description ILIKE $${paramIdx} OR je.reference_number ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      conditions.push(`je.status = $${paramIdx}`);
      values.push(status.toUpperCase());
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`je.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }
    if (startDate) {
      conditions.push(`je.entry_date >= $${paramIdx}`);
      values.push(startDate);
      paramIdx++;
    }
    if (endDate) {
      conditions.push(`je.entry_date <= $${paramIdx}`);
      values.push(endDate);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedFiltered(
    limit,
    offset,
    search,
    status,
    branchId,
    startDate,
    endDate,
  ) {
    let sql = `
      SELECT je.id, je.journal_number, TO_CHAR(je.entry_date, 'YYYY-MM-DD') as entry_date, 
             je.reference_number, je.description, je.total_amount, je.status, 
             je.created_at, b.branch_name
      FROM journal_entries je
      LEFT JOIN branches b ON je.branch_id = b.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(je.journal_number ILIKE $${paramIdx} OR je.description ILIKE $${paramIdx} OR je.reference_number ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      conditions.push(`je.status = $${paramIdx}`);
      values.push(status.toUpperCase());
      paramIdx++;
    }
    if (branchId && branchId !== "all") {
      conditions.push(`je.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }
    if (startDate) {
      conditions.push(`je.entry_date >= $${paramIdx}`);
      values.push(startDate);
      paramIdx++;
    }
    if (endDate) {
      conditions.push(`je.entry_date <= $${paramIdx}`);
      values.push(endDate);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY je.entry_date DESC, je.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = JournalEntry;
