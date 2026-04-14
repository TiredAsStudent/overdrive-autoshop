const { query } = require("../../config/db");

class StaffInventoryModel {
  // 1. Get the local shelf view (strictly locked to the user's branch)
  static async getLocalInventory(branchId, searchTerm = "") {
    let sql = `
      SELECT 
        i.id AS inventory_id,
        i.item_code,
        i.item_name,
        i.category,
        i.unit_cost,
        i.reorder_level,
        bi.stock_quantity,
        bi.reserved_quantity,
        (bi.stock_quantity - bi.reserved_quantity) AS available_quantity
      FROM branch_inventory bi
      JOIN inventory i ON bi.inventory_id = i.id
      WHERE bi.branch_id = $1 AND i.is_active = TRUE
    `;
    const params = [branchId];

    // Optional Search Filter for the frontend search bar
    if (searchTerm) {
      sql += ` AND (i.item_name ILIKE $2 OR i.item_code ILIKE $2 OR i.category ILIKE $2)`;
      params.push(`%${searchTerm}%`);
    }

    sql += ` ORDER BY i.category ASC, i.item_name ASC`;

    const result = await query(sql, params);
    return result.rows;
  }

  // 2. The "Rescue" Search (Find stock in other branches)
  static async getGlobalInventory(inventoryId, currentBranchId) {
    const sql = `
      SELECT 
        b.id AS branch_id,
        b.branch_name,
        bi.stock_quantity,
        bi.reserved_quantity,
        (bi.stock_quantity - bi.reserved_quantity) AS available_quantity
      FROM branch_inventory bi
      JOIN branches b ON bi.branch_id = b.id
      WHERE bi.inventory_id = $1 
        AND bi.branch_id != $2 -- Exclude the staff's current branch
      ORDER BY b.branch_name ASC
    `;
    const result = await query(sql, [inventoryId, currentBranchId]);
    return result.rows;
  }
}

module.exports = StaffInventoryModel;
