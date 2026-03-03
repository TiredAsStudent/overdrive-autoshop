const jwt = require("jsonwebtoken");

// Core Authentication Guard
const verifyToken = (req, res, next) => {
  let token = req.header("Authorization");

  if (!token) {
    return res
      .status(403)
      .json({ message: "Access Denied. No token provided." });
  }

  try {
    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trim();
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    // Payload contains { id, role, branch_id }
    req.user = verified;
    next();
  } catch (error) {
    res
      .status(401)
      .json({ message: "Invalid or expired token. Please log in again." });
  }
};

//Global Admin Guard
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access Denied. Admin privileges required." });
  }
  next();
};

//Branch Lock Guard
const branchGuard = (req, res, next) => {
  // Admins bypass the branch lock
  if (req.user.role === "admin") return next();

  const targetBranch =
    req.body?.branch_id || req.query?.branch_id || req.params?.branch_id;

  // If a branch is specified and it does not match the staff member's branch
  if (targetBranch && parseInt(targetBranch) !== req.user.branch_id) {
    return res.status(403).json({
      message: "Access Denied. You are locked to your specific branch.",
    });
  }

  next();
};

module.exports = { verifyToken, isAdmin, branchGuard };
