const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const AuthModel = require("../../models/auth/authModel");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  static generateToken(user) {
    const payload = {
      id: user.id,
      role: user.role,
      branchId: user.branch_id,
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "12h" });
  }

  static async loginWithEmail(email, password, ipAddress) {
    const user = await AuthModel.findUserByEmail(email);

    if (!user) throw new Error("Invalid credentials.");
    if (!user.is_active) throw new Error("This account has been disabled.");
    if (!user.password_hash)
      throw new Error("This account requires Google Login.");

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new Error("Invalid credentials.");

    const token = this.generateToken(user);
    await AuthModel.logAudit(
      user.id,
      user.branch_id,
      "LOGIN_SUCCESS_EMAIL",
      ipAddress,
    );

    delete user.password_hash;
    return { user, token };
  }

  static async loginWithGoogle(googleToken, ipAddress) {
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // Ensure the Google Email is actually verified by Google
    if (!payload.email_verified) {
      throw new Error("This Google account email is not verified.");
    }

    const user = await AuthModel.findUserByEmail(payload.email);
    if (!user)
      throw new Error("Email not registered. Please contact an Admin.");
    if (!user.is_active) throw new Error("This account has been disabled.");

    if (!user.google_id) {
      await AuthModel.linkGoogleId(user.id, payload.sub);
    }

    const token = this.generateToken(user);
    await AuthModel.logAudit(
      user.id,
      user.branch_id,
      "LOGIN_SUCCESS_GOOGLE",
      ipAddress,
    );

    delete user.password_hash;
    return { user, token };
  }
}

module.exports = AuthService;
