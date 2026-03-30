const db = require("../config/db");

class BulkOrderModel {
  static async generateShoppingList(client = db) {
    const query = `
      SELECT 
        m.id AS master_part_id,
        m.part_name,
        m.supplier_name,
        m.unit_cost,
        m.healthy_stock_per_branch,
        
        -- Calculate how many parts are needed across ALL branches combined
        SUM(
          GREATEST(m.healthy_stock_per_branch - COALESCE(b.quantity, 0), 0)
        ) AS total_quantity_to_order,
        
        -- Calculate the estimated cost for this specific part
        SUM(
          GREATEST(m.healthy_stock_per_branch - COALESCE(b.quantity, 0), 0) * m.unit_cost
        ) AS estimated_total_cost
        
      FROM master_inventory m
      -- CROSS JOIN ensures we check every branch, even if they have 0 stock
      CROSS JOIN branches br
      LEFT JOIN branch_local_stock b 
        ON m.id = b.master_part_id AND br.id = b.branch_id
        
      GROUP BY 
        m.id, m.part_name, m.supplier_name, m.unit_cost, m.healthy_stock_per_branch
        
      -- ONLY return items where we actually need to order at least 1 part
      HAVING SUM(GREATEST(m.healthy_stock_per_branch - COALESCE(b.quantity, 0), 0)) > 0
      
      ORDER BY m.supplier_name ASC, m.part_name ASC;
    `;

    const result = await client.query(query);
    return result.rows;
  }
}

module.exports = BulkOrderModel;
