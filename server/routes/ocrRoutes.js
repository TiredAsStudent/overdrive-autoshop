const express = require("express");
const router = express.Router();
const ocrController = require("../controllers/ocrController");

// Import Middlewares
const { verifyToken, branchGuard } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// POST /api/ocr/scan
router.post(
  "/scan",
  verifyToken,
  upload.single("receipt"),
  branchGuard,
  ocrController.processReceipt,
);

module.exports = router;
