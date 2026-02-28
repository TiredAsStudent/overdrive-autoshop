const pool = require("../config/db");

// CREATE: Add a new item
const createItem = async (itemName, category, quantity, unitPrice) => {
  const query = `
        INSERT INTO inventory (item_name, category, quantity, unit_price) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *;
    `;
  const result = await pool.query(query, [
    itemName,
    category,
    quantity,
    unitPrice,
  ]);
  return result.rows[0];
};

// READ: Get all items (Sorted alphabetically)
const getAllItems = async () => {
  const query = "SELECT * FROM inventory ORDER BY item_name ASC";
  const result = await pool.query(query);
  return result.rows;
};

// READ: Get a single item by its ID
const getItemById = async (id) => {
  const query = "SELECT * FROM inventory WHERE id = $1";
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// UPDATE: Modify an existing item (e.g., adding stock)
const updateItem = async (id, itemName, category, quantity, unitPrice) => {
  const query = `
        UPDATE inventory 
        SET item_name = $1, category = $2, quantity = $3, unit_price = $4 
        WHERE id = $5 
        RETURNING *;
    `;
  const result = await pool.query(query, [
    itemName,
    category,
    quantity,
    unitPrice,
    id,
  ]);
  return result.rows[0];
};

// DELETE: Remove an item entirely
const deleteItem = async (id) => {
  const query = "DELETE FROM inventory WHERE id = $1 RETURNING *";
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
};
