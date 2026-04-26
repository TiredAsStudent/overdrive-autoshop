const express = require("express");
const router = express.Router();

// Import Staff-Specific Controllers
const StaffInventoryController = require("../../controllers/staff/inventory.controller");
const StaffOcrController = require("../../controllers/staff/ocr.controller");
const CheckInController = require("../../controllers/staff/checkin.controller");

// Import Manager Controllers for the "Shared Read-Only" dropdowns!
const AccountController = require("../../controllers/manager/finance.controller");
const InventoryController = require("../../controllers/manager/inventory.controller");
const MechanicController = require("../../controllers/manager/mechanic.controller");
const ServiceController = require("../../controllers/manager/service.controller");
const SettingsController = require("../../controllers/sysadmin/settings.controller");

// Import Security Guards
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const branchGuard = require("../../middlewares/branchMiddleware");
const validate = require("../../middlewares/validateMiddleware");
const { uploadReceipt } = require("../../middlewares/uploadMiddleware");
const { ROLES } = require("../../constants/roles");

// Import Validation Schemas
const { checkInSchema } = require("../../validations/staff/checkin.schema");
const { ocrSubmitSchema } = require("../../validations/staff/ocr.schema");

const handleReceiptUpload = (req, res, next) => {
  const upload = uploadReceipt.single("receipt");
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ==========================================
// GLOBAL PORTAL SECURITY
// ==========================================
router.use(verifyToken, requireRole(ROLES.STAFF, ROLES.ADMIN), branchGuard);

// --- LOCAL STOCK ROOM ---
router.get("/inventory/local", StaffInventoryController.getLocalStock);
router.get(
  "/inventory/:inventoryId/global",
  StaffInventoryController.getGlobalStock,
);

// --- SHARED READ-ONLY ROUTES ---
router.get("/accounts/categories", AccountController.getBaseCategories);
router.get("/inventory/master", InventoryController.getInventory);
router.get("/mechanics", MechanicController.getMechanics);
router.get("/services", ServiceController.getServices);
router.get("/settings", SettingsController.getSettings);

// --- WORKSHOP: CHECK-IN & REGISTRATION ---
router.get("/checkin/search/:plate", CheckInController.searchPlate);
router.post(
  "/checkin",
  validate(checkInSchema),
  CheckInController.submitCheckIn,
);

// --- OCR INTAKE: SUB-TAB 1 ---
// Endpoint 1: Upload and Analyze
router.post(
  "/ocr/analyze",
  handleReceiptUpload,
  StaffOcrController.analyzeReceipt,
);

// Endpoint 2: Submit verified data (Human-in-the-Loop Handshake)
router.post(
  "/ocr/submit",
  validate(ocrSubmitSchema), // The Security Gate
  StaffOcrController.submitVerifiedReceipt,
);

router.post("/ocr/cancel", StaffOcrController.cancelAnalysis);

module.exports = router;
