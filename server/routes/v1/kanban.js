const express = require("express");
const router = express.Router();
const KanbanController = require("../../controllers/kanbanController");
const {
  authenticate,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Get the organized Kanban Board columns
router.get(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  KanbanController.getBoard,
);

// Drag & Drop / Assign Mechanic (Updates the card)
router.patch(
  "/:id/move",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  KanbanController.updateCard,
);

module.exports = router;
