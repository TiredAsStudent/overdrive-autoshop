const express = require("express");
const router = express.Router();
const AuthController = require("../../controllers/authController");
const {
  authenticate,
  requireRole,
} = require("../../middlewares/authMiddleware");
const { ROLES } = require("../../constants/roles");

// Public Routes
router.post("/login", AuthController.login);
router.post("/google", AuthController.googleLogin);
router.post("/setup-account", AuthController.setupAccount);

// Protected Admin Route
router.post(
  "/invite-staff",
  authenticate,
  requireRole(ROLES.ADMIN),
  AuthController.inviteUser,
);

module.exports = router;
