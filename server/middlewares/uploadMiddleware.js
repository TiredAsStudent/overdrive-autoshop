const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure physical directories exist before accepting files
const brandingDir = "uploads/branding/";
const receiptDir = "uploads/receipts/";

[brandingDir, receiptDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Strict MIME-Type Filter
const imageFileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const allowedMimeTypes = /image\/jpeg|image\/png|image\/webp/;

  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedMimeTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  // Immediately reject PDFs, ZIPs, or malicious executables disguised as images
  cb(
    new Error(
      "Strict Upload Policy: Only images (JPEG, PNG, WEBP) are allowed.",
    ),
  );
};

// Branding Logo Upload Configuration
const uploadLogo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, brandingDir),
    filename: (req, file, cb) => {
      // Create a clean, collision-free filename
      const cleanName = "logo-" + Date.now() + Math.round(Math.random() * 1e4);
      cb(null, cleanName + path.extname(file.originalname).toLowerCase());
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB Size Sentinel
  fileFilter: imageFileFilter,
});

// Strict Document & Image Filter for OCR (Allows PDF)
const documentFileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|pdf/;
  const allowedMimeTypes =
    /image\/jpeg|image\/png|image\/webp|application\/pdf/;

  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedMimeTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(
    new Error(
      "Strict Upload Policy: Only images (JPEG, PNG) and PDFs are allowed for receipts.",
    ),
  );
};

// Receipt Scan Upload (OCR Engine) - 10MB and supports PDF
const uploadReceipt = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, receiptDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        `receipt_${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`,
      );
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: documentFileFilter,
});

module.exports = { uploadLogo, uploadReceipt };
