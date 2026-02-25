const jwt = require("jsonwebtoken");

//Verify if the user is logged in (Has a valid token)
const verifyToken = (req, res, next) => {
  let token = req.header("Authorization");

  if (!token) {
    return res
      .status(403)
      .json({ message: "Access Denied. No token provided." });
  }

  try {
    // Standardize the token format (Remove 'Bearer ' if it exists)
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    // Verify the token using your secret key
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Attach the decoded payload (id, role) to the request

    next(); // Token is good, proceed to the requested route
  } catch (error) {
    res
      .status(401)
      .json({ message: "Invalid or expired token. Please log in again." });
  }
};

//Verify if the user has Admin privileges
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access Denied. Admin privileges required." });
  }
  next();
};

module.exports = { verifyToken, isAdmin };
