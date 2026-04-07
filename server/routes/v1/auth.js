const express = require("express");
const rateLimit = require("express-rate-limit");
const AuthController = require("../../controllers/auth/authController");
const validate = require("../../middlewares/validateMiddleware");
const { loginSchema } = require("../../validations/auth.schema");

const router = express.Router();

// Max 5 FAILED attempts per 15 minutes
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

// Public Routes
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  AuthController.login,
);
router.post("/google", loginLimiter, AuthController.googleLogin);

module.exports = router;
