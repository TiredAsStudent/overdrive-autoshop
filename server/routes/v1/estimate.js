const express = require("express");
const router = express.Router();
const EstimateController = require("../../controllers/estimateController");
const {
  authenticate,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Staff & Admin: View Estimates for their specific branch
router.get(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  EstimateController.getBranchEstimates,
);
router.get(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  EstimateController.getEstimateDetails,
);

// Staff (Maker): Create a Draft Quote (Does NOT touch inventory)
router.post(
  "/",
  authenticate,
  requireRole(ROLES.STAFF, ROLES.ADMIN),
  EstimateController.createEstimate,
);

// Staff (Maker) or Admin: Mark Quote as Approved by Customer or Rejected
router.patch(
  "/:id/status",
  authenticate,
  requireRole(ROLES.STAFF, ROLES.ADMIN),
  EstimateController.changeStatus,
);

// Staff (Maker): Convert Estimate to WIP (Triggers the Inventory Reservation Engine)
router.post(
  "/:id/convert-to-wip",
  authenticate,
  requireRole(ROLES.STAFF, ROLES.ADMIN),
  EstimateController.convertToWip,
);

// Staff (Maker): Process Final Payment (Records ledger, deducts inventory, locks invoice)
router.post(
  "/:id/pay",
  authenticate,
  requireRole(ROLES.STAFF, ROLES.ADMIN),
  EstimateController.payInvoice,
);

module.exports = router;
