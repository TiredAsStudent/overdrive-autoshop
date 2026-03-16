const express = require("express");
const router = express.Router();
const pipelineController = require("../controllers/pipelineController");
const {
  verifyToken,
  requireRole,
  branchGuard,
} = require("../middleware/authMiddleware");

router.use(verifyToken);

// Create the initial Estimate
router.post(
  "/estimate",
  requireRole(["Admin", "Staff"]),
  branchGuard,
  pipelineController.createEstimate,
);

// Advance the job to Sales Order or Invoice
router.put(
  "/:id/stage",
  requireRole(["Admin", "Staff"]),
  branchGuard,
  pipelineController.advanceStage,
);

// Change Kanban Status (Drag and Drop)
router.put(
  "/:id/status",
  requireRole(["Admin", "Staff"]),
  branchGuard,
  pipelineController.updateStatus,
);

// Cancel a Job and release reserved inventory
router.put(
  "/:id/cancel",
  requireRole(["Admin", "Staff"]),
  branchGuard,
  pipelineController.cancelServiceJob,
);

// View all jobs for the branch Kanban Dashboard
router.get(
  "/branch/:branch_id",
  requireRole(["Admin", "Staff"]),
  branchGuard,
  pipelineController.getJobs,
);

module.exports = router;
