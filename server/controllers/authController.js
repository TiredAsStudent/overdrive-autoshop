const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// REGISTRATION (To create your first Admin/Staff)
const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Basic validation
    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "All fields (email, password, role) are required." });
    }
    if (role !== "admin" && role !== "staff") {
      return res
        .status(400)
        .json({ message: "Role must be either 'admin' or 'staff'." });
    }

    // Check if user already exists to prevent duplicate errors
    const existingUser = await User.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Save the new user to the database
    const newUser = await User.createUser(email, hashedPassword, role);
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Registration Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during registration." });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Find the user in the database
    const user = await User.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Compare the provided password with the hashed database password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate the JWT Token containing the User ID and Role
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }, // Token expires in 12 hours
    );

    // Send the token and user data
    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error during login." });
  }
};

// GET CURRENT USER (For frontend page refreshes)
const getCurrentUser = async (req, res) => {
  try {
    // req.user is attached by the verifyToken middleware
    const query = "SELECT id, email, role, created_at FROM users WHERE id = $1";

    // import the pool directly here to run the quick query
    const pool = require("../config/db");
    const result = await pool.query(query, [req.user.id]);

    if (!result.rows[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send the user data back
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { register, login, getCurrentUser };
