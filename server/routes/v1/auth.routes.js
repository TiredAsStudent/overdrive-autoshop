const express = require("express");
const rateLimit = require("express-rate-limit");
const AuthController = require("../../controllers/auth/auth.controller"); // Path updated
const validate = require("../../middlewares/validateMiddleware");
const {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  activateAccountSchema,
  activateCustomerSchema,
} = require("../../validations/auth/auth.schema");

const router = express.Router();

// Login Limiter: Max 5 FAILED attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      message:
        "Too many failed login attempts. Please try again after 15 minutes.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Forgot Password Limiter: Max 3 email requests per 15 minutes per IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    success: false,
    error: {
      message: "Too many reset requests. Please try again after 15 minutes.",
    },
  },
});

// Public Routes
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  AuthController.login,
);
router.post("/google", loginLimiter, AuthController.googleLogin);

// Forgot & Reset Password Routes
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);

// Staff & Admin Activation routes
router.get("/verify-invite/:token", AuthController.verifyInvite);
router.post(
  "/activate",
  validate(activateAccountSchema),
  AuthController.activateAccount,
);

// Customer Activation routes
router.get(
  "/verify-customer-invite/:token",
  AuthController.verifyCustomerInvite,
);
router.post(
  "/activate-customer",
  validate(activateCustomerSchema),
  AuthController.activateCustomerAccount,
);

module.exports = router;
