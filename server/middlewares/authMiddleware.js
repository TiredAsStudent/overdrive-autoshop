const jwt = require("jsonwebtoken");

//JWT VERIFICATION
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

//ROLE-BASED ACCESS CONTROL (RBAC)
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

//THE BRANCH GUARD (Multi-Branch Security)
const branchGuard = (req, res, next) => {
  // Admin accounts possess global access and bypass the branch lock entirely
  if (req.user.role === "Admin") return next();

  //Safely hunt for the branch_id anywhere in the incoming request
  const branchData =
    req.params?.branch_id || req.body?.branch_id || req.query?.branch_id;

  if (branchData) {
    const requestedBranchId = parseInt(branchData, 10);

    if (isNaN(requestedBranchId)) {
      return res.status(400).json({ error: "Invalid branch ID format." });
    }

    // Enforce the lock for Staff members
    if (req.user.role === "Staff" && req.user.branch_id !== requestedBranchId) {
      return res.status(403).json({
        error: "Forbidden. You can only access data for your assigned branch.",
      });
    }
  }
  next();
};

module.exports = { verifyToken, requireRole, branchGuard };
