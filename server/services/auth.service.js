const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Branch = require("../models/Branch");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../utils/mailer");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  // ==========================================
  // TOKEN GENERATOR
  // ==========================================
  static generateToken(user) {
    const payload = {
      id: user.id,
      role: user.role,
      branchId: user.branch_id,
      token_version: user.token_version,
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "12h" });
  }

  // ==========================================
  // LOGIN FLOWS
  // ==========================================
  static async loginWithEmail(email, password, ipAddress) {
    const user = await User.findUserByEmail(email);

    if (!user) throw new Error("Invalid credentials.");
    if (!user.is_active) throw new Error("This account has been disabled.");
    if (!user.password_hash)
      throw new Error("This account requires Google Login.");

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new Error("Invalid credentials.");

    if (user.role === "STAFF") {
      if (!user.branch_id) {
        throw new Error("Access Denied: Staff must have an assigned branch.");
      }
      const branch = await Branch.getStatusById(user.branch_id);

      if (!branch) {
        throw new Error("Your assigned branch does not exist.");
      }
      if (branch.is_maintenance_mode) {
        throw new Error(
          "Access Denied: Your branch is currently under Maintenance Mode.",
        );
      }
      if (!branch.is_active) {
        throw new Error("Access Denied: Your branch has been decommissioned.");
      }
    }

    const token = this.generateToken(user);
    await User.logAudit(
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

    if (!payload.email_verified) {
      throw new Error("This Google account email is not verified.");
    }

    const user = await User.findUserByEmail(payload.email);
    if (!user)
      throw new Error("Email not registered. Please contact an Admin.");
    if (!user.is_active) throw new Error("This account has been disabled.");

    if (!user.google_id) {
      await User.linkGoogleId(user.id, payload.sub);
    }

    const token = this.generateToken(user);
    await User.logAudit(
      user.id,
      user.branch_id,
      "LOGIN_SUCCESS_GOOGLE",
      ipAddress,
    );

    delete user.password_hash;
    return { user, token };
  }

  // ==========================================
  // PASSWORD RESET FLOWS
  // ==========================================
  static async processForgotPassword(email) {
    const user = await User.findUserByEmail(email);

    if (!user || !user.is_active) return;

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await User.saveResetToken(user.id, hashedToken);

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

    const user = await User.findUserByResetToken(hashedToken);
    if (!user) {
      throw new Error(
        "Invalid or expired reset token. Please request a new one.",
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await User.updatePasswordAndLogAudit(
      user.id,
      newPasswordHash,
      user.branch_id,
      ipAddress,
    );
  }

  static async verifyResetToken(rawToken) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const user = await User.findUserByResetToken(hashedToken);
    if (!user) {
      throw new Error("This reset link has already been used or has expired.");
    }
    return true;
  }

  // ==========================================
  // STAFF & MANAGER ACTIVATION FLOWS
  // ==========================================
  static async verifyActivationToken(rawToken) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const user = await User.findUserByActivationToken(hashedToken);

    if (!user) {
      throw new Error("This invitation link is invalid or has expired.");
    }

    const expiresAt = new Date(user.activation_token_expires).getTime();
    const now = new Date().getTime();
    const timeRemainingMs = expiresAt - now;

    return {
      firstName: user.first_name,
      email: user.email,
      role: user.role,
      branchName: user.branch_name || "Enterprise Global",
      expiresAt: user.activation_token_expires,
      timeRemainingMs: timeRemainingMs > 0 ? timeRemainingMs : 0,
    };
  }

  static async processActivation(rawToken, newPassword, ipAddress) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await User.findUserByActivationToken(hashedToken);
    if (!user) {
      throw new Error(
        "This invitation link has expired. Please contact your Admin for a new invite.",
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await User.activateUserAndLogAudit(
      user.id,
      newPasswordHash,
      user.branch_id,
      ipAddress,
    );
  }

  // ==========================================
  // CUSTOMER ACTIVATION FLOWS
  // ==========================================
  static async verifyCustomerActivationToken(rawToken) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const user = await User.findCustomerByActivationToken(hashedToken);

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
    const user = await User.findCustomerByActivationToken(hashedToken);

    if (!user) {
      throw new Error("This activation link is invalid or has expired.");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await User.activateCustomerAndLogAudit(user.id, newPasswordHash, ipAddress);

    const payload = {
      id: user.id,
      role: user.role,
      branchId: null,
      token_version: user.token_version + 1,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

    return { token, firstName: user.first_name };
  }
}

module.exports = AuthService;
