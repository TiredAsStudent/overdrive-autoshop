const { query, pool } = require("../config/db");

class Estimate {
  static async generateEstimateCode() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `EST-${yearMonth}-`;

    const sql = `SELECT estimate_number FROM estimates WHERE estimate_number LIKE $1 ORDER BY id DESC LIMIT 1`;
    const result = await query(sql, [`${prefix}%`]);

    let sequence = 1;
    if (result.rows[0]) {
      const lastSequence = parseInt(
        result.rows[0].estimate_number.split("-")[2],
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  static async createTransaction(estimateData, computedItems) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const headerSql = `
        INSERT INTO estimates (
          estimate_number, customer_id, branch_id, 
          subtotal, total_discount, vat_amount, grand_total, 
          status, valid_until, notes, terms_conditions, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING_APPROVAL', $8, $9, $10, $11)
        RETURNING *
      `;
      const headerValues = [
        estimateData.estimate_number,
        estimateData.customer_id,
        estimateData.branch_id,
        estimateData.subtotal,
        estimateData.total_discount,
        estimateData.vat_amount,
        estimateData.grand_total,
        estimateData.valid_until,
        estimateData.notes,
        estimateData.terms_conditions,
        estimateData.created_by,
      ];
      const headerRes = await client.query(headerSql, headerValues);
      const newEstimate = headerRes.rows[0];

      for (const item of computedItems) {
        const itemSql = `
          INSERT INTO estimate_items (
            estimate_id, line_type, service_id, item_id, 
            quantity, recorded_unit_cost, recorded_selling_price, discount_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await client.query(itemSql, [
          newEstimate.id,
          item.line_type,
          item.service_id,
          item.item_id,
          item.quantity,
          item.recorded_unit_cost,
          item.recorded_selling_price,
          item.discount_amount,
        ]);
      }

      await client.query("COMMIT");
      return newEstimate;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateTransaction(id, estimateData, computedItems) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const headerSql = `
        UPDATE estimates SET 
          customer_id = $1, subtotal = $2, total_discount = $3, vat_amount = $4, 
          grand_total = $5, valid_until = $6, notes = $7, terms_conditions = $8, updated_at = NOW()
        WHERE id = $9
        RETURNING *
      `;
      const headerValues = [
        estimateData.customer_id,
        estimateData.subtotal,
        estimateData.total_discount,
        estimateData.vat_amount,
        estimateData.grand_total,
        estimateData.valid_until,
        estimateData.notes,
        estimateData.terms_conditions,
        id,
      ];
      const headerRes = await client.query(headerSql, headerValues);
      const updatedEstimate = headerRes.rows[0];

      await client.query(`DELETE FROM estimate_items WHERE estimate_id = $1`, [
        id,
      ]);

      for (const item of computedItems) {
        const itemSql = `
          INSERT INTO estimate_items (
            estimate_id, line_type, service_id, item_id, 
            quantity, recorded_unit_cost, recorded_selling_price, discount_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await client.query(itemSql, [
          id,
          item.line_type,
          item.service_id,
          item.item_id,
          item.quantity,
          item.recorded_unit_cost,
          item.recorded_selling_price,
          item.discount_amount,
        ]);
      }

      await client.query("COMMIT");
      return updatedEstimate;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateStatus(id, status) {
    const sql = `UPDATE estimates SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const result = await query(sql, [status, id]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT 
        e.id, e.estimate_number, e.customer_id, e.branch_id, e.subtotal, e.total_discount, 
        e.vat_amount, e.grand_total, TO_CHAR(e.valid_until, 'YYYY-MM-DD') AS valid_until, e.notes, e.terms_conditions, e.created_by, e.created_at, e.updated_at,
        CASE 
          WHEN e.status IN ('DRAFT', 'PENDING_APPROVAL') AND e.valid_until < CURRENT_DATE THEN 'EXPIRED' 
          ELSE e.status 
        END as status,
        c.full_name as customer_name, c.contact_number, c.email, b.branch_name, u.first_name as created_by_name
      FROM estimates e
      JOIN customers c ON e.customer_id = c.id
      JOIN branches b ON e.branch_id = b.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `;
    const result = await query(sql, [id]);
    const estimate = result.rows[0];
    if (!estimate) return null;

    const itemsSql = `
      SELECT ei.*, 
             s.service_code, s.service_name, 
             i.sku, i.item_name
      FROM estimate_items ei
      LEFT JOIN services s ON ei.service_id = s.id
      LEFT JOIN inventory_items i ON ei.item_id = i.id
      WHERE ei.estimate_id = $1
    `;
    const itemsResult = await query(itemsSql, [id]);
    estimate.items = itemsResult.rows;

    return estimate;
  }

  static async countFiltered(search, status, branchId) {
    let sql = `
      SELECT COUNT(DISTINCT e.id) 
      FROM estimates e
      JOIN customers c ON e.customer_id = c.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(e.estimate_number ILIKE $${paramIdx} OR c.full_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      if (status.toUpperCase() === "EXPIRED") {
        conditions.push(
          `(e.status IN ('DRAFT', 'PENDING_APPROVAL') AND e.valid_until < CURRENT_DATE)`,
        );
      } else {
        conditions.push(
          `(e.status = $${paramIdx} AND (e.valid_until >= CURRENT_DATE OR e.status NOT IN ('DRAFT', 'PENDING_APPROVAL')))`,
        );
        values.push(status.toUpperCase());
        paramIdx++;
      }
    }
    if (branchId && branchId !== "all") {
      conditions.push(`e.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedFiltered(limit, offset, search, status, branchId) {
    let sql = `
      SELECT e.id, e.estimate_number, e.grand_total, TO_CHAR(e.valid_until, 'YYYY-MM-DD') AS valid_until, e.created_at,
             CASE 
               WHEN e.status IN ('DRAFT', 'PENDING_APPROVAL') AND e.valid_until < CURRENT_DATE THEN 'EXPIRED' 
               ELSE e.status 
             END as status,
             c.full_name as customer_name, b.branch_name
      FROM estimates e
      JOIN customers c ON e.customer_id = c.id
      JOIN branches b ON e.branch_id = b.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(e.estimate_number ILIKE $${paramIdx} OR c.full_name ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status && status !== "all") {
      if (status.toUpperCase() === "EXPIRED") {
        conditions.push(
          `(e.status IN ('DRAFT', 'PENDING_APPROVAL') AND e.valid_until < CURRENT_DATE)`,
        );
      } else {
        conditions.push(
          `(e.status = $${paramIdx} AND (e.valid_until >= CURRENT_DATE OR e.status NOT IN ('DRAFT', 'PENDING_APPROVAL')))`,
        );
        values.push(status.toUpperCase());
        paramIdx++;
      }
    }
    if (branchId && branchId !== "all") {
      conditions.push(`e.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY e.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }
}

module.exports = Estimate;
