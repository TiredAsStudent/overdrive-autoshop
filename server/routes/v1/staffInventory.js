const express = require("express");
const StaffInventoryController = require("../../controllers/staff/inventoryController");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

const router = express.Router();

// SECURITY: Must be logged in. Only STAFF (and ADMINs testing the system) can view this.
router.use(verifyToken, requireRole([ROLES.STAFF, ROLES.ADMIN]));

// 1. Get Local Stock (The "Shelf View")
// Accepts optional query param: ?search=oil
router.get("/local", StaffInventoryController.getLocalStock);

// 2. Get Global Stock (The "Enterprise Rescue View")
// Pass the inventory_id in the URL
router.get("/:inventoryId/global", StaffInventoryController.getGlobalStock);

module.exports = router;
