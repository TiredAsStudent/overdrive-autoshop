const express = require("express");
const router = express.Router();
const ocrController = require("../controllers/ocrController");
const upload = require("../middleware/uploadMiddleware");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.use(verifyToken);

//Upload image, get the extraction (No DB save yet)
router.post(
  "/scan",
  requireRole(["Admin", "Staff"]),
  upload.single("receipt"),
  ocrController.scanReceipt,
);

//Submit the verified/edited data to the Pending Queue
router.post(
  "/submit",
  requireRole(["Admin", "Staff"]),
  ocrController.submitVerifiedData,
);

//Admin views the Pending Queue
router.get("/queue", requireRole(["Admin"]), ocrController.getApprovalQueue);

//Admin approves or rejects the record
router.put(
  "/approve/:id",
  requireRole(["Admin"]),
  ocrController.processApproval,
);

module.exports = router;
