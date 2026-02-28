const Inventory = require("../models/inventoryModel");

//CREATE ITEM
const addItem = async (req, res) => {
  try {
    const { item_name, category, quantity, unit_price } = req.body;

    if (!item_name || !category || quantity === undefined || !unit_price) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Clean the input slightly
    const cleanName = item_name.trim();

    const newItem = await Inventory.createItem(
      cleanName,
      category,
      quantity,
      unit_price,
    );
    res.status(201).json({ message: "Item added successfully", item: newItem });
  } catch (error) {
    console.error("Add Item Error:", error);
    // Catch duplicate name errors from PostgreSQL (Error code 23505)
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "An item with this name already exists." });
    }
    res.status(500).json({ message: "Internal server error." });
  }
};

// GET ALL ITEMS
const getItems = async (req, res) => {
  try {
    const items = await Inventory.getAllItems();
    res.status(200).json(items);
  } catch (error) {
    console.error("Get Items Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// UPDATE ITEM
const editItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const { item_name, category, quantity, unit_price } = req.body;

    const updatedItem = await Inventory.updateItem(
      itemId,
      item_name,
      category,
      quantity,
      unit_price,
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found." });
    }

    res
      .status(200)
      .json({ message: "Item updated successfully", item: updatedItem });
  } catch (error) {
    console.error("Update Item Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// DELETE ITEM
const removeItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const deletedItem = await Inventory.deleteItem(itemId);

    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found." });
    }

    res
      .status(200)
      .json({ message: "Item deleted successfully", item: deletedItem });
  } catch (error) {
    console.error("Delete Item Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { addItem, getItems, editItem, removeItem };
