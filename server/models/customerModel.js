const pool = require("../config/db");

const CustomerPortal = {
  //Get all vehicles owned by this customer
  getMyVehicles: async (customer_id) => {
    const result = await pool.query(
      `SELECT id, plate_number, make, model, year 
             FROM vehicles 
             WHERE owner_id = $1 
             ORDER BY created_at DESC`,
      [customer_id],
    );
    return result.rows;
  },

  //Get LIVE Active Jobs (Status Tracker)
  getActiveJobs: async (customer_id) => {
    const result = await pool.query(
      `SELECT sj.id AS job_id, sj.current_stage, sj.status, sj.grand_total, sj.updated_at,
                    v.plate_number, v.make, v.model, 
                    b.branch_name
             FROM service_jobs sj
             JOIN vehicles v ON sj.vehicle_id = v.id
             JOIN branches b ON sj.branch_id = b.id
             WHERE v.owner_id = $1 AND sj.status != 'Done'
             ORDER BY sj.updated_at DESC`,
      [customer_id],
    );
    return result.rows;
  },

  //Get Service History (Past Invoices)
  getServiceHistory: async (customer_id) => {
    const result = await pool.query(
      `SELECT sj.id AS job_id, sj.grand_total, sj.updated_at AS invoice_date,
                    v.plate_number, v.make, v.model,
                    b.branch_name
             FROM service_jobs sj
             JOIN vehicles v ON sj.vehicle_id = v.id
             JOIN branches b ON sj.branch_id = b.id
             WHERE v.owner_id = $1 AND sj.current_stage = 'Invoice' AND sj.status = 'Done'
             ORDER BY sj.updated_at DESC`,
      [customer_id],
    );
    return result.rows;
  },

  //View a specific Invoice's Line Items
  getInvoiceDetails: async (job_id, customer_id) => {
    // First, grab the header, enforcing that this customer owns the linked vehicle
    const headerResult = await pool.query(
      `SELECT sj.*, v.plate_number, v.make, v.model, b.branch_name
             FROM service_jobs sj
             JOIN vehicles v ON sj.vehicle_id = v.id
             JOIN branches b ON sj.branch_id = b.id
             WHERE sj.id = $1 AND v.owner_id = $2 AND sj.current_stage = 'Invoice'`,
      [job_id, customer_id],
    );

    if (headerResult.rows.length === 0) return null; // Blocked or doesn't exist

    // Then, grab the specific parts and labor used
    const itemsResult = await pool.query(
      `SELECT item_name, quantity, unit_price, subtotal, is_service 
             FROM job_items 
             WHERE job_id = $1
             ORDER BY is_service DESC, item_name ASC`,
      [job_id],
    );

    return {
      header: headerResult.rows[0],
      items: itemsResult.rows,
    };
  },
};

module.exports = CustomerPortal;
