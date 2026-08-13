const { query, pool } = require("../config/db");

class StockAdjustment {
  static async countFiltered(search, status, branch = "all") {
    let sql = `
      SELECT COUNT(DISTINCT sar.id) 
      FROM stock_adjustment_requests sar
      JOIN inventory_items i ON sar.item_id = i.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (status !== "all") {
      conditions.push(`sar.status = $${paramIdx}`);
      values.push(status);
      paramIdx++;
    }
    if (branch !== "all") {
      conditions.push(`sar.branch_id = $${paramIdx}`);
      values.push(branch);
      paramIdx++;
    }
    if (search) {
      conditions.push(
        `(i.item_name ILIKE $${paramIdx} OR i.sku ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginated(limit, offset, search, status, branch = "all") {
    let sql = `
      SELECT 
        sar.id, sar.adjustment_number, sar.adjustment_type, sar.quantity AS requested_quantity, 
        sar.reason, sar.staff_remarks, sar.status, sar.created_at, 
        sar.manager_remarks, sar.resolved_at, sar.current_system_quantity, sar.physical_count,
        sar.evidence_url, -- Retrieves the photo evidence
        i.sku, i.item_name, i.category, i.unit_cost, i.uom,
        b.branch_name,
        u.first_name AS requester_first_name, u.last_name AS requester_last_name,
        r.first_name AS resolver_first_name, r.last_name AS resolver_last_name
      FROM stock_adjustment_requests sar
      JOIN inventory_items i ON sar.item_id = i.id
      JOIN branches b ON sar.branch_id = b.id
      LEFT JOIN users u ON sar.requested_by = u.id
      LEFT JOIN users r ON sar.resolved_by = r.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (status !== "all") {
      conditions.push(`sar.status = $${paramIdx}`);
      values.push(status);
      paramIdx++;
    }
    if (branch !== "all") {
      conditions.push(`sar.branch_id = $${paramIdx}`);
      values.push(branch);
      paramIdx++;
    }
    if (search) {
      conditions.push(
        `(i.item_name ILIKE $${paramIdx} OR i.sku ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY sar.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  static async approveTransaction(requestId, managerId, managerRemarks) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const reqRes = await client.query(
        "SELECT * FROM stock_adjustment_requests WHERE id = $1 FOR UPDATE",
        [requestId],
      );
      const request = reqRes.rows[0];

      if (!request) throw new Error("Adjustment request not found.");
      if (request.status !== "PENDING")
        throw new Error(
          `This request has already been ${request.status.toLowerCase()}.`,
        );

      const invRes = await client.query(
        `
        SELECT bi.quantity, i.unit_cost 
        FROM branch_inventory bi
        JOIN inventory_items i ON bi.item_id = i.id
        WHERE bi.branch_id = $1 AND bi.item_id = $2
        FOR UPDATE
      `,
        [request.branch_id, request.item_id],
      );

      if (invRes.rows.length === 0)
        throw new Error("Critical: Branch inventory linkage missing.");

      const { quantity: currentQuantity, unit_cost: unitCost } = invRes.rows[0];
      let qtyAdded = 0,
        qtyDeducted = 0;
      let newQuantity = currentQuantity;

      if (request.adjustment_type === "ADD") {
        qtyAdded = request.quantity;
        newQuantity += request.quantity;
      } else {
        qtyDeducted = request.quantity;
        newQuantity -= request.quantity;
        if (newQuantity < 0) {
          throw new Error(
            `Concurrency Conflict: Physical stock dropped to ${currentQuantity} while this request was pending. Cannot deduct ${request.quantity}.`,
          );
        }
      }

      await client.query(
        `
        UPDATE branch_inventory 
        SET quantity = $1, last_restock_date = CASE WHEN $2 > 0 THEN NOW() ELSE last_restock_date END 
        WHERE branch_id = $3 AND item_id = $4
      `,
        [newQuantity, qtyAdded, request.branch_id, request.item_id],
      );

      const referenceCode = `ADJ-WF-${Date.now().toString().slice(-6)}`;
      await client.query(
        `
        INSERT INTO inventory_movements (item_id, branch_id, transaction_type, transaction_reference, quantity_added, quantity_deducted, remaining_quantity, remarks, adjustment_reason, recorded_unit_cost, created_by)
        VALUES ($1, $2, 'MANUAL_ADJUSTMENT', $3, $4, $5, $6, $7, $8, $9, $10)
      `,
        [
          request.item_id,
          request.branch_id,
          referenceCode,
          qtyAdded,
          qtyDeducted,
          newQuantity,
          request.staff_remarks || "Approved via Workflow",
          request.reason,
          unitCost,
          managerId,
        ],
      );

      const updateReq = await client.query(
        `
        UPDATE stock_adjustment_requests 
        SET status = 'APPROVED', resolved_by = $1, manager_remarks = $2, resolved_at = NOW() 
        WHERE id = $3 RETURNING *
      `,
        [managerId, managerRemarks, requestId],
      );

      await client.query("COMMIT");
      return updateReq.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async rejectRequest(requestId, managerId, managerRemarks) {
    const sql = `
      UPDATE stock_adjustment_requests 
      SET status = 'REJECTED', resolved_by = $1, manager_remarks = $2, resolved_at = NOW() 
      WHERE id = $3 AND status = 'PENDING'
      RETURNING *
    `;
    const result = await query(sql, [managerId, managerRemarks, requestId]);
    if (result.rows.length === 0)
      throw new Error("Request not found or already resolved.");
    return result.rows[0];
  }

  static async checkPendingRequest(itemId, branchId) {
    const sql = `
      SELECT id FROM stock_adjustment_requests 
      WHERE item_id = $1 AND branch_id = $2 AND status = 'PENDING'
    `;
    const result = await query(sql, [itemId, branchId]);
    return result.rows[0];
  }

  static async createRequest(data) {
    const sql = `
      INSERT INTO stock_adjustment_requests (
        adjustment_number, item_id, branch_id, requested_by, adjustment_type, 
        current_system_quantity, physical_count, quantity, reason, staff_remarks, 
        status, evidence_url
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11)
      RETURNING *
    `;

    const datePrefix = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const adjustmentNumber = `ADJ-${datePrefix}-${randomSuffix}`;

    const values = [
      adjustmentNumber,
      data.item_id,
      data.branch_id,
      data.requested_by,
      data.adjustment_type,
      data.current_system_quantity,
      data.physical_count,
      data.quantity,
      data.reason,
      data.staff_remarks,
      data.evidence_url || null,
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }
}

module.exports = StockAdjustment;
