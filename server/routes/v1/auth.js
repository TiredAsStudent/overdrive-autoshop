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

// Protected Admin Route (Staff/Manager 2-Hour Invites)
router.post(
  "/invite-staff",
  authenticate,
  requireRole(ROLES.ADMIN),
  AuthController.inviteUser,
);

// Protected Operational Route (Customer Service Registration)
// Staff AND Admins can check in vehicles and register customers
router.post(
  "/invite-customer",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.STAFF),
  AuthController.inviteCustomer,
);

module.exports = router;
