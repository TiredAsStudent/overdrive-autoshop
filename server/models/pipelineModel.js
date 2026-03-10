const pool = require("../config/db");

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

      let total_labor = 0;
      let total_parts = 0;

      // Calculate totals
      items.forEach((item) => {
        const subtotal = item.quantity * item.unit_price;
        if (item.is_service) total_labor += subtotal;
        else total_parts += subtotal;
      });
      const grand_total = total_labor + total_parts;

      // Insert the Job Header
      const jobRes = await client.query(
        `INSERT INTO service_jobs (vehicle_id, branch_id, assigned_mechanic_id, total_labor_cost, total_parts_cost, grand_total, current_stage)
                 VALUES ($1, $2, $3, $4, $5, $6, 'Estimate') RETURNING *`,
        [
          vehicle_id,
          branch_id,
          assigned_mechanic_id,
          total_labor,
          total_parts,
          grand_total,
        ],
      );
      const jobId = jobRes.rows[0].id;

      // Insert Line Items
      for (const item of items) {
        const subtotal = item.quantity * item.unit_price;
        await client.query(
          `INSERT INTO job_items (job_id, inventory_id, item_name, quantity, unit_price, subtotal, is_service)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            jobId,
            item.inventory_id || null,
            item.item_name,
            item.quantity,
            item.unit_price,
            subtotal,
            item.is_service,
          ],
        );
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

  //Convert to Sales Order
  convertToSalesOrder: async (job_id) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      //Update the Job Stage and Kanban Status
      const jobRes = await client.query(
        `UPDATE service_jobs SET current_stage = 'Sales Order', status = 'Ongoing', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [job_id],
      );

      //Fetch only the physical parts (ignore labor)
      const items = await client.query(
        `SELECT inventory_id, quantity FROM job_items WHERE job_id = $1 AND is_service = FALSE`,
        [job_id],
      );

      //Reserve the stock
      for (const item of items.rows) {
        await client.query(
          `UPDATE inventory SET qty_reserved = qty_reserved + $1 WHERE id = $2`,
          [item.quantity, item.inventory_id],
        );
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

  //Final Invoice
  convertToInvoice: async (job_id) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      //Update the Job Stage to Invoice and Kanban Status to Done
      const jobRes = await client.query(
        `UPDATE service_jobs SET current_stage = 'Invoice', status = 'Done', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [job_id],
      );

      //Fetch the physical parts
      const items = await client.query(
        `SELECT inventory_id, quantity FROM job_items WHERE job_id = $1 AND is_service = FALSE`,
        [job_id],
      );

      //Final Deduction (Clear reservation, drop on-hand count)
      for (const item of items.rows) {
        await client.query(
          `UPDATE inventory 
                     SET qty_on_hand = qty_on_hand - $1, 
                         qty_reserved = qty_reserved - $1,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $2`,
          [item.quantity, item.inventory_id],
        );
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

  // View jobs for the Kanban Board
  getBranchJobs: async (branch_id) => {
    const result = await pool.query(
      `SELECT sj.*, v.plate_number, v.make, v.model, u.full_name as mechanic_name 
             FROM service_jobs sj
             JOIN vehicles v ON sj.vehicle_id = v.id
             LEFT JOIN users u ON sj.assigned_mechanic_id = u.id
             WHERE sj.branch_id = $1
             ORDER BY sj.created_at DESC`,
      [branch_id],
    );
    return result.rows;
  },

  // Update Kanban Status (Pending, Ongoing, Cleaning, Done)
  updateJobStatus: async (job_id, status) => {
    const result = await pool.query(
      `UPDATE service_jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, job_id],
    );
    return result.rows[0];
  },
};

module.exports = Pipeline;
