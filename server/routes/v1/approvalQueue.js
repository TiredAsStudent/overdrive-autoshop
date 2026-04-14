const express = require("express");
const OcrController = require("../../controllers/approval/ocrController");
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { approveReceiptSchema } = require("../../validations/approval.schema");
const { ROLES } = require("../../constants/roles");

const router = express.Router();

// Strict Admin Security: Only the Checker can access these routes
router.use(verifyToken, requireRole(ROLES.ADMIN));

// 1. Inbox / Summary List
router.get("/ocr", OcrController.getQueue);

// 2. Side-by-Side Detail View
router.get("/ocr/:id", OcrController.getDetails);

// 3. The Action Triggers
router.post(
  "/ocr/:id/approve",
  validate(approveReceiptSchema),
  OcrController.approve,
);
router.post("/ocr/:id/reject", OcrController.reject);

module.exports = router;
