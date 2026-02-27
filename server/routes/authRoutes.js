const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Middleware
const { verifyToken } = require("../middleware/authMiddleware");

// POST /api/auth/register
router.post("/register", authController.register);

// POST /api/auth/login
router.post("/login", authController.login);

// GET /api/auth/me
router.get("/me", verifyToken, authController.getCurrentUser);

module.exports = router;
