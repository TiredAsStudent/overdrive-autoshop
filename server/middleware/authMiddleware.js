const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Forbidden. Insufficient permissions." });
    }
    next();
  };
};

const branchGuard = (req, res, next) => {
  const requestedBranchId = parseInt(
    req.params.branch_id || req.body.branch_id,
  );

  if (req.user.role === "Admin") return next();

  if (req.user.role === "Staff" && req.user.branch_id !== requestedBranchId) {
    return res.status(403).json({
      error: "Forbidden. You can only access data for your assigned branch.",
    });
  }

  next();
};

module.exports = { verifyToken, requireRole, branchGuard };
