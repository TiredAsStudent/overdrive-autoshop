const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const AuthModel = require("../../models/auth/authModel");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../../utils/mailer");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  // --Generate Token--
  static generateToken(user) {
    const payload = {
      id: user.id,
      role: user.role,
      branchId: user.branch_id,
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "12h" });
  }

  // --Login with Email--
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

  // --Login with Google--
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

  // --Process forgot password--
  static async processForgotPassword(email) {
    const user = await AuthModel.findUserByEmail(email);

    if (!user || !user.is_active) return;

    // Generate a raw, URL-safe crypto token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await AuthModel.saveResetToken(user.id, hashedToken);

    // Construct URL and Send Email
    const frontendUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(user.email, resetLink);
  }

  // --Process reset password--
  static async processResetPassword(rawToken, newPassword, ipAddress) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Check if token exists and is not expired
    const user = await AuthModel.findUserByResetToken(hashedToken);
    if (!user) {
      throw new Error(
        "Invalid or expired reset token. Please request a new one.",
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await AuthModel.updatePasswordAndLogAudit(
      user.id,
      newPasswordHash,
      user.branch_id, // NULL if Admin, Number if Staff
      ipAddress,
    );
  }

  // --Verify Activation Token--
  static async verifyActivationToken(rawToken) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await AuthModel.findUserByActivationToken(hashedToken);

    if (!user) {
      throw new Error("This invitation link is invalid or has expired.");
    }

    // Calculate remaining time for the frontend countdown timer
    const expiresAt = new Date(user.activation_token_expires).getTime();
    const now = new Date().getTime();
    const timeRemainingMs = expiresAt - now;

    return {
      firstName: user.first_name,
      email: user.email,
      role: user.role,
      branchName: user.branch_name || "Global Enterprise", // Fallback if Admin (branch_id = NULL)
      expiresAt: user.activation_token_expires,
      timeRemainingMs: timeRemainingMs > 0 ? timeRemainingMs : 0,
    };
  }

  // --Process Account Activation--
  static async processActivation(rawToken, newPassword, ipAddress) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await AuthModel.findUserByActivationToken(hashedToken);
    if (!user) {
      throw new Error(
        "This invitation link has expired. Please contact your Admin for a new invite.",
      );
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await AuthModel.activateUserAndLogAudit(
      user.id,
      newPasswordHash,
      user.branch_id,
      ipAddress,
    );
  }

  // --Verify Customer Activation Token--
  static async verifyCustomerActivationToken(rawToken) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const user = await AuthModel.findCustomerByActivationToken(hashedToken);

    if (!user) {
      throw new Error("This activation link is invalid or has expired.");
    }

    return {
      firstName: user.first_name,
      email: user.email,
      role: user.role,
      vehicle: {
        make: user.make || "Unknown Make",
        model: user.model || "Unknown Model",
        plateNumber: user.plate_number || "PENDING",
      },
    };
  }

  // --Process Customer Activation & Auto-Login--
  static async processCustomerActivation(rawToken, newPassword, ipAddress) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const user = await AuthModel.findCustomerByActivationToken(hashedToken);

    if (!user) {
      throw new Error("This activation link is invalid or has expired.");
    }

    // Hash the password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Atomic Activation
    await AuthModel.activateCustomerAndLogAudit(
      user.id,
      newPasswordHash,
      ipAddress,
    );

    // Auto-Login Logic
    const payload = {
      id: user.id,
      role: user.role,
      branchId: null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

    return { token, firstName: user.first_name };
  }
}

module.exports = AuthService;
