const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.use(verifyToken);
router.use(requireRole(["Customer"]));

// View owned vehicles
router.get("/vehicles", customerController.fetchMyVehicles);

// View live status of ongoing repairs (The Live Tracker)
router.get("/tracker/live", customerController.fetchLiveStatus);

// View past service history
router.get("/history", customerController.fetchHistory);

// Download/View a specific past invoice
router.get("/invoice/:job_id", customerController.fetchInvoiceDetails);

module.exports = router;
