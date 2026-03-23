const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  verifyToken,
  requireRole,
  branchGuard,
} = require("../middlewares/authMiddleware");

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/google-login", authController.googleLogin);

router.get(
  "/test-branch-access/:branch_id",
  verifyToken,
  requireRole(["Admin", "Staff"]),
  branchGuard,
  (req, res) => {
    res.status(200).json({
      message: "Access Granted.",
      userRole: req.user.role,
      accessedBranch: req.params.branch_id,
    });
  },
);

module.exports = router;
