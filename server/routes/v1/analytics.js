const express = require("express");
const router = express.Router();
const AnalyticsController = require("../../controllers/analyticsController");
const {
  authenticate,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Performance Leaderboard API
router.get(
  "/leaderboard",
  authenticate,
  requireRole(ROLES.ADMIN),
  AnalyticsController.getPerformanceLeaderboard,
);

// Dual-Basis Ledger API (Cash vs Accrual)
router.get(
  "/ledger",
  authenticate,
  requireRole(ROLES.ADMIN),
  AnalyticsController.getDualBasisLedger,
);

module.exports = router;
