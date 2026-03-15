const pool = require("../config/db");
const Decimal = require("decimal.js");
const moneyUtils = require("../utils/moneyUtils");

const Pipeline = {
  //Create Draft Estimate
  createEstimate: async (
    vehicle_id,
    branch_id,
    assigned_mechanic_id,
    items,
  ) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let total_labor = new Decimal(0);
      let total_parts = new Decimal(0);

      items.forEach((item) => {
        const subtotal = new Decimal(item.quantity).times(item.unit_price);
        if (item.is_service) total_labor = total_labor.plus(subtotal);
        else total_parts = total_parts.plus(subtotal);
      });

      const final_total_labor = total_labor.toDecimalPlaces(2).toNumber();
      const final_total_parts = total_parts.toDecimalPlaces(2).toNumber();
      const grand_total = moneyUtils.add(final_total_labor, final_total_parts);

      // Insert Header
      const jobRes = await client.query(
        `INSERT INTO service_jobs (vehicle_id, branch_id, assigned_mechanic_id, total_labor_cost, total_parts_cost, grand_total, current_stage, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Estimate', 'Pending') RETURNING *`,
        [
          vehicle_id,
          branch_id,
          assigned_mechanic_id,
          final_total_labor,
          final_total_parts,
          grand_total,
        ],
      );
      const jobId = jobRes.rows[0].id;

      //Concurrent Inserts
      const insertPromises = items.map((item) => {
        const itemSubtotal = moneyUtils.multiply(
          item.quantity,
          item.unit_price,
        );
        return client.query(
          `INSERT INTO job_items (job_id, inventory_id, item_name, quantity, unit_price, subtotal, is_service)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            jobId,
            item.inventory_id || null,
            item.item_name,
            item.quantity,
            item.unit_price,
            itemSubtotal,
            item.is_service,
          ],
        );
      });
      await Promise.all(insertPromises);

      await client.query("COMMIT");
      return jobRes.rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },

  //Convert to Sales Order
  convertToSalesOrder: async (job_id) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const jobRes = await client.query(
        `UPDATE service_jobs SET current_stage = 'Sales Order', status = 'Ongoing', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [job_id],
      );

      const items = await client.query(
        `SELECT inventory_id, quantity FROM job_items WHERE job_id = $1 AND is_service = FALSE`,
        [job_id],
      );

      //Concurrent Stock Reservation
      const reservePromises = items.rows.map((item) => {
        return client
          .query(
            `UPDATE inventory 
           SET qty_reserved = qty_reserved + $1 
           WHERE id = $2 AND (qty_on_hand - qty_reserved) >= $1 RETURNING *`,
            [item.quantity, item.inventory_id],
          )
          .then((res) => {
            if (res.rowCount === 0)
              throw new Error(
                `Insufficient stock for inventory ID ${item.inventory_id}.`,
              );
          });
      });
      await Promise.all(reservePromises);

      await client.query("COMMIT");
      return jobRes.rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },

  //Final Invoice
  convertToInvoice: async (job_id) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const jobRes = await client.query(
        `UPDATE service_jobs SET current_stage = 'Invoice', status = 'Done', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [job_id],
      );

      const items = await client.query(
        `SELECT inventory_id, quantity FROM job_items WHERE job_id = $1 AND is_service = FALSE`,
        [job_id],
      );

      //Concurrent Stock Deduction
      const deductPromises = items.rows.map((item) => {
        return client.query(
          `UPDATE inventory 
           SET qty_on_hand = qty_on_hand - $1, qty_reserved = qty_reserved - $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [item.quantity, item.inventory_id],
        );
      });
      await Promise.all(deductPromises);

      await client.query("COMMIT");
      return jobRes.rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },

  //Cancel Job & Release Reserved Inventory
  cancelJob: async (job_id) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const checkStage = await client.query(
        `SELECT current_stage FROM service_jobs WHERE id = $1`,
        [job_id],
      );
      if (checkStage.rows.length === 0) throw new Error("Job not found.");

      const isSalesOrder = checkStage.rows[0].current_stage === "Sales Order";

      const jobRes = await client.query(
        `UPDATE service_jobs SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [job_id],
      );

      if (isSalesOrder) {
        const items = await client.query(
          `SELECT inventory_id, quantity FROM job_items WHERE job_id = $1 AND is_service = FALSE`,
          [job_id],
        );

        const releasePromises = items.rows.map((item) => {
          return client.query(
            `UPDATE inventory 
             SET qty_reserved = qty_reserved - $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [item.quantity, item.inventory_id],
          );
        });
        await Promise.all(releasePromises);
      }

      await client.query("COMMIT");
      return jobRes.rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },

  //View jobs for the Kanban Board
  getBranchJobs: async (branch_id, limit, offset) => {
    //Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) 
       FROM service_jobs sj
       WHERE sj.branch_id = $1 AND sj.status != 'Cancelled'`,
      [branch_id],
    );
    const totalRecords = parseInt(countResult.rows[0].count, 10);

    //Get the actual paginated chunk
    const result = await pool.query(
      `SELECT sj.*, v.plate_number, v.make, v.model, u.full_name as mechanic_name 
       FROM service_jobs sj
       JOIN vehicles v ON sj.vehicle_id = v.id
       LEFT JOIN users u ON sj.assigned_mechanic_id = u.id
       WHERE sj.branch_id = $1 AND sj.status != 'Cancelled'
       ORDER BY sj.created_at DESC
       LIMIT $2 OFFSET $3`,
      [branch_id, limit, offset],
    );

    return {
      data: result.rows,
      totalRecords: totalRecords,
    };
  },

  updateJobStatus: async (job_id, status) => {
    const result = await pool.query(
      `UPDATE service_jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, job_id],
    );
    return result.rows[0];
  },
};

module.exports = Pipeline;
