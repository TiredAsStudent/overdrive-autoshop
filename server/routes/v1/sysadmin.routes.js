const express = require("express");
const router = express.Router();
const multer = require("multer");

// Controllers
const UserController = require("../../controllers/sysadmin/user.controller");
const BranchController = require("../../controllers/sysadmin/branch.controller");
const SettingsController = require("../../controllers/sysadmin/settings.controller");
const AuditLogController = require("../../controllers/sysadmin/audit.controller");
const BackupController = require("../../controllers/sysadmin/backup.controller");

// Middlewares
const validate = require("../../middlewares/validateMiddleware");
const { uploadLogo } = require("../../middlewares/uploadMiddleware");
const { sendError } = require("../../utils/responseHandler");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Validations
const {
  updateSettingsSchema,
} = require("../../validations/sysadmin/settings.schema");
const {
  getBranchesSchema,
  createBranchSchema,
  updateBranchSchema,
  toggleMaintenanceSchema,
} = require("../../validations/sysadmin/branch.schema");
const {
  getRosterSchema,
  inviteUserSchema,
  updateUserSchema,
} = require("../../validations/sysadmin/user.schema");
const {
  getAuditLogsSchema,
} = require("../../validations/sysadmin/auditLog.schema");
const {
  getBackupsSchema,
} = require("../../validations/sysadmin/backup.schema");

// ==========================================
// UTILITY: Catch Multer File Errors cleanly
// ==========================================
const handleLogoUpload = (req, res, next) => {
  const upload = uploadLogo.single("logo");

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return sendError(res, 400, "File Upload Error", err.message);
    } else if (err) {
      return sendError(res, 400, "Invalid File Type", err.message);
    }
    next();
  });
};

// ==========================================
// GLOBAL SECURITY: SysAdmin Only
// ==========================================
router.use(verifyToken, requireRole(ROLES.ADMIN));

// ==========================================
// SUB-TAB 2.1: BRANCH MANAGEMENT
// ==========================================
router.post(
  "/branches",
  validate(createBranchSchema),
  BranchController.createBranch,
);

router.get(
  "/branches",
  validate(getBranchesSchema),
  BranchController.getAllBranches,
);

router.get("/branches/:id", BranchController.getBranch);

router.put(
  "/branches/:id",
  validate(updateBranchSchema),
  BranchController.updateBranch,
);

router.delete("/branches/:id", BranchController.deleteBranch);

// The Security Kill-Switch
router.patch(
  "/branches/:id/maintenance",
  validate(toggleMaintenanceSchema),
  BranchController.toggleMaintenance,
);

// ==========================================
// SUB-TAB 3.1: BUSINESS SETTINGS
// ==========================================
router.get("/settings", SettingsController.getSettings);

router.put(
  "/settings",
  handleLogoUpload,
  validate(updateSettingsSchema),
  SettingsController.updateSettings,
);

// ==========================================
// SUB-TAB 2.2: USER MANAGEMENT & SECURITY
// ==========================================
router.get("/users", validate(getRosterSchema), UserController.getRoster);

router.post(
  "/users/invite",
  validate(inviteUserSchema),
  UserController.inviteUser,
);

router.put("/users/:id", validate(updateUserSchema), UserController.updateUser);

// The Security Kill-Switch
router.post("/users/:id/kill-session", UserController.killSession);

// Resend Expired Invites
router.post("/users/:id/resend-invite", UserController.resendInvite);

// ==========================================
// SUB-TAB 4.1: AUDIT LOGS & COMPLIANCE
// ==========================================

router.get("/audit/severities", AuditLogController.getSeverities);

router.get(
  "/audit/export",
  validate(getAuditLogsSchema),
  AuditLogController.exportLogs,
);

router.get("/audit", validate(getAuditLogsSchema), AuditLogController.getLogs);

// ==========================================
// SUB-TAB 4.2: DATABASE BACKUPS
// ==========================================
router.get("/backups", validate(getBackupsSchema), BackupController.getBackups);

router.post("/backups/trigger", BackupController.triggerBackup);

module.exports = router;
