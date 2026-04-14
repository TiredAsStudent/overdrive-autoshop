const express = require("express");
const AuditLogController = require("../../controllers/controlCenter/AuditLogController");
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { getAuditLogsSchema } = require("../../validations/auditLog.schema");
const { ROLES } = require("../../constants/roles");

const router = express.Router();

//  Must be logged in AND an Admin
router.use(verifyToken);
router.use(requireRole(ROLES.ADMIN));

// The Read-Only Route
router.get("/", validate(getAuditLogsSchema), AuditLogController.getLogs);

module.exports = router;
