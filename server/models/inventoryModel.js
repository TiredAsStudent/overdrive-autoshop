const pool = require("../config/db");

const Inventory = {
  //GET BRANCH INVENTORY
  getBranchInventory: async (branch_id) => {
    const result = await pool.query(
      `SELECT *, (qty_on_hand - qty_reserved) AS qty_available 
       FROM inventory 
       WHERE branch_id = $1 
       ORDER BY item_name ASC`,
      [branch_id],
    );
    return result.rows;
  },

  //CREATE NEW ITEM (ADMIN ONLY)
  createItem: async (
    branch_id,
    item_code,
    item_name,
    category,
    cost_price,
    selling_price,
    qty_on_hand,
    low_stock_threshold,
  ) => {
    const result = await pool.query(
      `INSERT INTO inventory (branch_id, item_code, item_name, category, cost_price, selling_price, qty_on_hand, low_stock_threshold) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        branch_id,
        item_code,
        item_name,
        category,
        cost_price,
        selling_price,
        qty_on_hand,
        low_stock_threshold,
      ],
    );
    return result.rows[0];
  },

  //STAFF REQUESTS ADJUSTMENT (MAKER)
  requestAdjustment: async (
    inventory_id,
    branch_id,
    maker_id,
    previous_qty,
    requested_qty,
    reason,
  ) => {
    const result = await pool.query(
      `INSERT INTO inventory_adjustments (inventory_id, branch_id, maker_id, previous_qty, requested_qty, reason, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending') RETURNING *`,
      [inventory_id, branch_id, maker_id, previous_qty, requested_qty, reason],
    );
    return result.rows[0];
  },

  //ADMIN VIEWS QUEUE (CHECKER)
  getPendingAdjustments: async () => {
    const result = await pool.query(
      `SELECT a.*, i.item_name, i.item_code, b.branch_name, u.full_name AS maker_name 
       FROM inventory_adjustments a
       JOIN inventory i ON a.inventory_id = i.id
       JOIN branches b ON a.branch_id = b.id
       JOIN users u ON a.maker_id = u.id
       WHERE a.status = 'Pending'
       ORDER BY a.created_at ASC`,
    );
    return result.rows;
  },

  // 5. ADMIN PROCESSES ADJUSTMENT
  processAdjustment: async (
    adjustment_id,
    checker_id,
    action,
    inventory_id,
    requested_qty,
  ) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN"); // Start Transaction

      // Basic Logic Check
      if (action === "Approved" && requested_qty < 0) {
        throw new Error(
          "Physical stock count cannot be updated to a negative number.",
        );
      }

      //Update the status of the adjustment request
      const adjResult = await client.query(
        `UPDATE inventory_adjustments 
         SET status = $1, checker_id = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 RETURNING *`,
        [action, checker_id, adjustment_id],
      );

      //If Approved, attempt to update the physical stock count
      if (action === "Approved") {
        const updateRes = await client.query(
          `UPDATE inventory 
           SET qty_on_hand = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2 AND $1 >= qty_reserved RETURNING *`,
          [requested_qty, inventory_id],
        );

        if (updateRes.rowCount === 0) {
          throw new Error(
            "Cannot approve: The requested physical stock is lower than the stock currently reserved for active jobs in the workshop.",
          );
        }
      }

      await client.query("COMMIT"); // Commit both changes
      return adjResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK"); // Cancel if anything fails
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = Inventory;
