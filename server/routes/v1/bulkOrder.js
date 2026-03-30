const express = require("express");
const router = express.Router();
const BulkOrderController = require("../../controllers/bulkOrderController");
const {
  authenticate,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Admin-only: Scans all branches and outputs the master shopping list
router.get(
  "/generate",
  authenticate,
  requireRole(ROLES.ADMIN),
  BulkOrderController.generateBulkOrder,
);

module.exports = router;
