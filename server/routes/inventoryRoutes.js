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

//Admin views the queue of all pending corrections
router.get(
  "/adjustments/queue",
  requireRole(["Admin"]),
  inventoryController.getAdjustmentsQueue,
);

//Staff requests a count correction
router.post(
  "/adjust",
  requireRole(["Admin", "Staff"]),
  branchGuard,
  inventoryController.submitAdjustment,
);

//Admin approves or rejects the correction
router.put(
  "/adjustments/:id",
  requireRole(["Admin"]),
  inventoryController.processAdjustment,
);

// View Branch Inventory
router.get(
  "/:branch_id",
  requireRole(["Admin", "Staff"]),
  branchGuard,
  inventoryController.fetchInventory,
);

module.exports = router;
