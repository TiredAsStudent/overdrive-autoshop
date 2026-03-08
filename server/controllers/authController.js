const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwtUtils");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register
exports.register = async (req, res) => {
  const { email, password, full_name, role, branch_id } = req.body;

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser)
      return res.status(400).json({ error: "Email already exists." });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.createTraditionalUser(
      email,
      password_hash,
      full_name,
      role,
      branch_id,
    );
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({ error: "Invalid credentials." });

    if (!user.password_hash)
      return res
        .status(400)
        .json({ error: "Please login using Google OAuth." });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid credentials." });

    const token = generateToken(user);
    res.status(200).json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        branch_id: user.branch_id,
      },
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Google Login
exports.googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, sub: google_id } = ticket.getPayload();

    let user = await User.findByEmail(email);

    if (!user) {
      user = await User.createGoogleUser(email, name, "Customer", google_id);
    } else if (!user.google_id) {
      user = await User.updateGoogleId(email, google_id);
    }

    const token = generateToken(user);
    res.status(200).json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        branch_id: user.branch_id,
      },
    });
  } catch (err) {
    console.error("Google Auth Error:", err.message);
    res.status(401).json({ error: "Google authentication failed." });
  }
};
