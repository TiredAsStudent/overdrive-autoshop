const express = require("express");
const InventoryController = require("../../controllers/inventory/inventoryController");
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const {
  createInventorySchema,
  updateInventorySchema,
} = require("../../validations/inventory.schema");
const { ROLES } = require("../../constants/roles");

const router = express.Router();

router.use(verifyToken);

// Admin & Staff can view inventory
router.get(
  "/",
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  InventoryController.getInventory,
);

// Only Admin can add or edit the Master Catalogue items
router.post(
  "/",
  requireRole(ROLES.ADMIN),
  validate(createInventorySchema),
  InventoryController.createInventoryItem,
);
router.put(
  "/:id",
  requireRole(ROLES.ADMIN),
  validate(updateInventorySchema),
  InventoryController.updateInventoryItem,
);

module.exports = router;
