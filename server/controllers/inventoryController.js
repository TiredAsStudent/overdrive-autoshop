const Inventory = require("../models/inventoryModel");

exports.fetchInventory = async (req, res) => {
  try {
    const { branch_id } = req.params;
    const inventory = await Inventory.getBranchInventory(branch_id);
    res
      .status(200)
      .json({ message: "Inventory fetched successfully.", inventory });
  } catch (err) {
    console.error("Fetch Inventory Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.addNewItem = async (req, res) => {
  try {
    const {
      branch_id,
      item_code,
      item_name,
      category,
      cost_price,
      selling_price,
      qty_on_hand,
      low_stock_threshold,
    } = req.body;

    const newItem = await Inventory.createItem(
      branch_id,
      item_code,
      item_name,
      category,
      cost_price,
      selling_price,
      qty_on_hand,
      low_stock_threshold,
    );
    res
      .status(201)
      .json({ message: "New item added to inventory.", item: newItem });
  } catch (err) {
    console.error("Add Item Error:", err.message);

    if (err.code === "23505") {
      return res.status(400).json({
        error: "An item with this code already exists in this branch.",
      });
    }
    res.status(500).json({ error: "Internal server error." });
  }
};

//Staff submits a discrepancy
exports.submitAdjustment = async (req, res) => {
  try {
    const { inventory_id, previous_qty, requested_qty, reason } = req.body;
    const branch_id = req.user.branch_id;
    const maker_id = req.user.id;

    const pendingRequest = await Inventory.requestAdjustment(
      inventory_id,
      branch_id,
      maker_id,
      previous_qty,
      requested_qty,
      reason,
    );
    res.status(201).json({
      message: "Adjustment sent to Admin for approval.",
      request: pendingRequest,
    });
  } catch (err) {
    console.error("Submit Adjustment Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

//Admin views queue
exports.getAdjustmentsQueue = async (req, res) => {
  try {
    const queue = await Inventory.getPendingAdjustments();
    res.status(200).json(queue);
  } catch (err) {
    console.error("Get Adjustments Queue Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

//Admin Approves/Rejects
exports.processAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, inventory_id, requested_qty } = req.body; // action: 'Approved' or 'Rejected'
    const checker_id = req.user.id;

    if (!["Approved", "Rejected"].includes(action)) {
      return res
        .status(400)
        .json({ error: "Invalid action. Must be 'Approved' or 'Rejected'." });
    }

    const processedRecord = await Inventory.processAdjustment(
      id,
      checker_id,
      action,
      inventory_id,
      requested_qty,
    );

    res.status(200).json({
      message: `Adjustment ${action} successfully.`,
      record: processedRecord,
    });
  } catch (err) {
    console.error("Process Adjustment Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};
