const express = require("express");
const router = express.Router();
const ocrController = require("../controllers/ocrController");

// Import Middlewares
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const handleUpload = (req, res, next) => {
  const uploadSingle = upload.single("receipt");

  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// POST /api/ocr/scan
router.post("/scan", verifyToken, handleUpload, ocrController.processReceipt);

module.exports = router;
