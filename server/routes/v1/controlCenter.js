const express = require("express");
const UserManagementController = require("../../controllers/controlCenter/userManagementController");
const validate = require("../../middlewares/validateMiddleware");
const {
  verifyToken,
  requireRole,
} = require("../../middlewares/authMiddleware");
const branchGuard = require("../../middlewares/branchMiddleware");
const {
  inviteUserSchema,
  updateUserSchema,
} = require("../../validations/userManagement.schema");
const { ROLES } = require("../../constants/roles");

const router = express.Router();

// ALL routes here require JWT, ADMIN role, and Branch context evaluation
router.use(verifyToken);
router.use(requireRole(ROLES.ADMIN));
router.use(branchGuard);

// --- USER MANAGEMENT (Gatekeeper) ---

// POST /api/v1/control-center/users/invite
router.post(
  "/users/invite",
  validate(inviteUserSchema),
  UserManagementController.inviteUser,
);

// GET /api/v1/control-center/users
router.get("/users", UserManagementController.getRoster);

// PUT /api/v1/control-center/users/:id
router.put(
  "/users/:id",
  validate(updateUserSchema),
  UserManagementController.updateUser,
);

// POST /api/v1/control-center/users/:id/resend-invite
router.post("/users/:id/resend-invite", UserManagementController.resendInvite);

module.exports = router;
