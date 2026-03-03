const pool = require("../config/db");

// Create a new inventory item
const createItem = async (
  branchId,
  itemName,
  category,
  qty,
  unitCost,
  markupPrice,
  taxCategory,
) => {
  const query = `
    INSERT INTO inventory (branch_id, item_name, category, quantity, unit_cost, markup_price, tax_category) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING *;
  `;
  const result = await pool.query(query, [
    branchId,
    itemName,
    category,
    qty,
    unitCost,
    markupPrice,
    taxCategory,
  ]);
  return result.rows[0];
};

//Get items for a specific branch (Staff View)
const getItemsByBranch = async (branchId) => {
  const query =
    "SELECT * FROM inventory WHERE branch_id = $1 ORDER BY item_name ASC";
  const result = await pool.query(query, [branchId]);
  return result.rows;
};

//Get ALL items across all branches (Admin Global View)
const getAllItemsGlobal = async () => {
  const query = "SELECT * FROM inventory ORDER BY branch_id ASC, item_name ASC";
  const result = await pool.query(query);
  return result.rows;
};

// Update an existing item (e.g., adding stock or changing price)
const updateItem = async (
  id,
  branchId,
  itemName,
  category,
  qty,
  unitCost,
  markupPrice,
  taxCategory,
) => {
  const query = `
    UPDATE inventory 
    SET item_name = $1, category = $2, quantity = $3, unit_cost = $4, markup_price = $5, tax_category = $6, last_updated = CURRENT_TIMESTAMP
    WHERE id = $7 AND branch_id = $8
    RETURNING *;
  `;
  const result = await pool.query(query, [
    itemName,
    category,
    qty,
    unitCost,
    markupPrice,
    taxCategory,
    id,
    branchId,
  ]);
  return result.rows[0];
};

//Delete an item securely
const deleteItem = async (id, branchId) => {
  const query =
    "DELETE FROM inventory WHERE id = $1 AND branch_id = $2 RETURNING *";
  const result = await pool.query(query, [id, branchId]);
  return result.rows[0];
};

module.exports = {
  createItem,
  getItemsByBranch,
  getAllItemsGlobal,
  updateItem,
  deleteItem,
};
