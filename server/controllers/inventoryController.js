const Inventory = require("../models/inventoryModel");

// Add a new item
const addItem = async (req, res) => {
  try {
    const { item_name, category, quantity, unit_cost, tax_category } = req.body;

    if (
      !item_name ||
      !category ||
      quantity === undefined ||
      unit_cost === undefined
    ) {
      return res.status(400).json({
        message: "Item name, category, quantity, and unit cost are required.",
      });
    }

    // Admins can specify which branch to add to. Staff are locked to their JWT branch_id.
    const targetBranchId =
      req.user.role === "admin"
        ? req.body.branch_id || req.user.branch_id
        : req.user.branch_id;

    // Auto-calculate the +25% markup price
    const markupPrice = (parseFloat(unit_cost) * 1.25).toFixed(2);

    // Default to VAT-Exempt if not specified
    const tax = tax_category || "VAT-Exempt";

    const newItem = await Inventory.createItem(
      targetBranchId,
      item_name.trim(),
      category,
      quantity,
      unit_cost,
      markupPrice,
      tax,
    );

    res.status(201).json({ message: "Item added successfully", item: newItem });
  } catch (error) {
    console.error("Add Item Error:", error);
    // Handle PostgreSQL Unique Constraint Error (e.g., trying to add "Oil Filter" twice to Branch 1)
    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "This item already exists in this branch. Please update the existing stock instead.",
      });
    }
    res.status(500).json({ message: "Internal server error adding item." });
  }
};

// Get the stock list
const getItems = async (req, res) => {
  try {
    // Admins get the Global View. Staff get the Local View.
    const items =
      req.user.role === "admin"
        ? await Inventory.getAllItemsGlobal()
        : await Inventory.getItemsByBranch(req.user.branch_id);

    res.status(200).json(items);
  } catch (error) {
    console.error("Get Items Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error fetching inventory." });
  }
};

// Edit an existing item
const editItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const { item_name, category, quantity, unit_cost, tax_category } = req.body;

    const targetBranchId =
      req.user.role === "admin"
        ? req.body.branch_id || req.user.branch_id
        : req.user.branch_id;
    const markupPrice = (parseFloat(unit_cost) * 1.25).toFixed(2);
    const tax = tax_category || "VAT-Exempt";

    const updatedItem = await Inventory.updateItem(
      itemId,
      targetBranchId,
      item_name.trim(),
      category,
      quantity,
      unit_cost,
      markupPrice,
      tax,
    );

    if (!updatedItem) {
      return res.status(404).json({
        message: "Item not found or you do not have permission to edit it.",
      });
    }

    res
      .status(200)
      .json({ message: "Item updated successfully", item: updatedItem });
  } catch (error) {
    console.error("Update Item Error:", error);
    res.status(500).json({ message: "Internal server error updating item." });
  }
};

// Delete an item
const removeItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const targetBranchId =
      req.user.role === "admin"
        ? req.body.branch_id || req.user.branch_id
        : req.user.branch_id;

    const deletedItem = await Inventory.deleteItem(itemId, targetBranchId);

    if (!deletedItem) {
      return res.status(404).json({
        message: "Item not found or you do not have permission to delete it.",
      });
    }

    res
      .status(200)
      .json({ message: "Item deleted successfully", item: deletedItem });
  } catch (error) {
    console.error("Delete Item Error:", error);
    res.status(500).json({ message: "Internal server error deleting item." });
  }
};

module.exports = { addItem, getItems, editItem, removeItem };
