const express = require("express");
const router = express.Router();
const ocrController = require("../controllers/ocrController");
const upload = require("../middlewares/uploadMiddleware");
const {
  verifyToken,
  requireRole,
  branchGuard,
} = require("../middlewares/authMiddleware");

router.use(verifyToken);

//Upload image, get the extraction (No DB save yet)
router.post(
  "/scan",
  requireRole(["Admin", "Staff"]),
  upload.single("receipt"),
  branchGuard,
  ocrController.scanReceipt,
);

//Submit the verified/edited data to the Pending Queue
router.post(
  "/submit",
  requireRole(["Admin", "Staff"]),
  branchGuard,
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
