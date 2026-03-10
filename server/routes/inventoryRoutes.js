const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const {
  verifyToken,
  requireRole,
  branchGuard,
} = require("../middleware/authMiddleware");

router.use(verifyToken);

// Admin adds a brand new item to the system
router.post("/item", requireRole(["Admin"]), inventoryController.addNewItem);

// View Branch Inventory
router.get(
  "/:branch_id",
  requireRole(["Admin", "Staff"]),
  branchGuard,
  inventoryController.fetchInventory,
);

//Staff requests a count correction
router.post(
  "/adjust",
  requireRole(["Admin", "Staff"]),
  inventoryController.submitAdjustment,
);

//Admin views the queue of all pending corrections
router.get(
  "/adjustments/queue",
  requireRole(["Admin"]),
  inventoryController.getAdjustmentsQueue,
);

//Admin approves or rejects the correction
router.put(
  "/adjustments/:id",
  requireRole(["Admin"]),
  inventoryController.processAdjustment,
);

module.exports = router;
