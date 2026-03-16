const Inventory = require("../models/inventoryModel");
const catchAsync = require("../utils/catchAsync");

exports.fetchInventory = catchAsync(async (req, res, next) => {
  const { branch_id } = req.params;
  const inventory = await Inventory.getBranchInventory(branch_id);
  res
    .status(200)
    .json({ message: "Inventory fetched successfully.", inventory });
});

exports.addNewItem = catchAsync(async (req, res, next) => {
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
});

exports.submitAdjustment = catchAsync(async (req, res, next) => {
  const { inventory_id, previous_qty, requested_qty, reason } = req.body;
  const branch_id = req.user.branch_id;
  const maker_id = req.user.id;

  if (requested_qty < 0) {
    return res
      .status(400)
      .json({ error: "Requested quantity cannot be negative." });
  }

  const pendingRequest = await Inventory.requestAdjustment(
    inventory_id,
    branch_id,
    maker_id,
    previous_qty,
    requested_qty,
    reason,
  );
  res
    .status(201)
    .json({
      message: "Adjustment sent to Admin for approval.",
      request: pendingRequest,
    });
});

exports.getAdjustmentsQueue = catchAsync(async (req, res, next) => {
  const queue = await Inventory.getPendingAdjustments();
  res.status(200).json(queue);
});

exports.processAdjustment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { action, inventory_id, requested_qty } = req.body;
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
  res
    .status(200)
    .json({
      message: `Adjustment ${action} successfully.`,
      record: processedRecord,
    });
});
