const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure physical directories exist before accepting files
const brandingDir = "uploads/branding/";
const receiptDir = "uploads/receipts/";
const adjustmentDir = "uploads/adjustments/";
const paymentDir = "uploads/payments/";
const billDir = "uploads/bills/";
const vendorPaymentDir = "uploads/vendor-payments/";
const expenseDir = "uploads/expenses/";

[
  brandingDir,
  receiptDir,
  adjustmentDir,
  paymentDir,
  billDir,
  vendorPaymentDir,
  expenseDir,
].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Strict MIME-Type Filter for Images
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
  cb(
    new Error(
      "Strict Upload Policy: Only images (JPEG, PNG, WEBP) are allowed.",
    ),
  );
};

// Strict Document & Image Filter for OCR, Bills, Expenses & Vendor Payments (Allows PDF)
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
      "Strict Upload Policy: Only images (JPEG, PNG) and PDFs are allowed.",
    ),
  );
};

// Branding Logo Upload Configuration
const uploadLogo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, brandingDir),
    filename: (req, file, cb) => {
      const cleanName = "logo-" + Date.now() + Math.round(Math.random() * 1e4);
      cb(null, cleanName + path.extname(file.originalname).toLowerCase());
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

// Stock Adjustment Evidence Configuration
const uploadAdjustmentEvidence = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, adjustmentDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        `evidence_${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`,
      );
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

// Receipt Scan Upload (OCR Engine)
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFileFilter,
});

// Proof of Payment Upload Configuration (AR)
const uploadPaymentProof = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, paymentDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        `proof_${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`,
      );
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

// Electronic Bill Attachment Upload Configuration
const uploadBillAttachment = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, billDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        `bill_${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`,
      );
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFileFilter,
});

// Vendor Payment Proof Upload Configuration (AP)
const uploadVendorPaymentProof = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, vendorPaymentDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        `vpay_${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`,
      );
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFileFilter,
});

// Manual Expense Attachment Configuration
const uploadExpenseAttachment = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, expenseDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        `expense_${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`,
      );
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFileFilter,
});

module.exports = {
  uploadLogo,
  uploadReceipt,
  uploadAdjustmentEvidence,
  uploadPaymentProof,
  uploadBillAttachment,
  uploadVendorPaymentProof,
  uploadExpenseAttachment,
};
