const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure directories exist
const brandingDir = "uploads/branding/";
const receiptDir = "uploads/receipts/";

[brandingDir, receiptDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Common file filter
const imageFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp|jfif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  cb(new Error("Only images (jpeg, jpg, png, webp) are allowed."));
};

// 1. Branding Logo Upload
const uploadLogo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, brandingDir),
    filename: (req, file, cb) =>
      cb(null, "logo-" + Date.now() + path.extname(file.originalname)),
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFileFilter,
});

// 2. Receipt Scan Upload (Higher limit for physical photos)
const uploadReceipt = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, receiptDir),
    filename: (req, file, cb) => {
      // Secure naming: receipt_timestamp_random.jpg
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        `receipt_${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`,
      );
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB to handle phone camera photos
  fileFilter: imageFileFilter,
});

module.exports = { uploadLogo, uploadReceipt };
