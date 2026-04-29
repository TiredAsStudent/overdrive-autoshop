const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Branch = require("../models/Branch");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../utils/mailer");
const { logSecureAction } = require("../utils/auditLogger");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  static generateToken(user) {
    const payload = {
      id: user.id,
      role: user.role,
      branchId: user.branch_id,
      token_version: user.token_version,
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "12h" });
  }

  static async loginWithEmail(email, password, ipAddress) {
    const user = await User.findUserByEmail(email);

    if (!user) throw new Error("Invalid credentials.");
    if (!user.is_active) throw new Error("This account has been disabled.");
    if (!user.password_hash)
      throw new Error("This account requires Google Login.");

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new Error("Invalid credentials.");

    if (user.role === "STAFF") {
      if (!user.branch_id)
        throw new Error("Access Denied: Staff must have an assigned branch.");
      const branch = await Branch.getStatusById(user.branch_id);
      if (!branch) throw new Error("Your assigned branch does not exist.");
      if (branch.is_maintenance_mode)
        throw new Error(
          "Access Denied: Your branch is currently under Maintenance Mode.",
        );
      if (!branch.is_active)
        throw new Error("Access Denied: Your branch has been decommissioned.");
    }

    const token = this.generateToken(user);
    await logSecureAction(
      user.id,
      user.branch_id,
      "LOGIN_SUCCESS_EMAIL",
      "INFO",
      ipAddress,
      "users",
      user.id,
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

    if (!payload.email_verified)
      throw new Error("This Google account email is not verified.");

    const user = await User.findUserByEmail(payload.email);
    if (!user)
      throw new Error("Email not registered. Please contact an Admin.");
    if (!user.is_active) throw new Error("This account has been disabled.");

    if (!user.google_id) await User.linkGoogleId(user.id, payload.sub);

    const token = this.generateToken(user);
    await logSecureAction(
      user.id,
      user.branch_id,
      "LOGIN_SUCCESS_GOOGLE",
      "INFO",
      ipAddress,
      "users",
      user.id,
    );

    delete user.password_hash;
    return { user, token };
  }

  static async processForgotPassword(email, ipAddress) {
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
    await logSecureAction(
      user.id,
      user.branch_id,
      "PASSWORD_RESET_REQUESTED",
      "WARNING",
      ipAddress,
      "users",
      user.id,
    );
  }

  static async processResetPassword(rawToken, newPassword, ipAddress) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const user = await User.findUserByResetToken(hashedToken);

    if (!user)
      throw new Error(
        "Invalid or expired reset token. Please request a new one.",
      );

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(user.id, newPasswordHash);

    await logSecureAction(
      user.id,
      user.branch_id,
      "PASSWORD_RESET_SUCCESS",
      "INFO",
      ipAddress,
      "users",
      user.id,
    );
  }

  static async verifyResetToken(rawToken) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const user = await User.findUserByResetToken(hashedToken);
    if (!user)
      throw new Error("This reset link has already been used or has expired.");
    return true;
  }

  static async verifyActivationToken(rawToken) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const user = await User.findUserByActivationToken(hashedToken);

    if (!user)
      throw new Error("This invitation link is invalid or has expired.");

    const expiresAt = new Date(user.activation_token_expires).getTime();
    const now = new Date().getTime();
    return {
      firstName: user.first_name,
      email: user.email,
      role: user.role,
      branchName: user.branch_name || "Enterprise Global",
      expiresAt: user.activation_token_expires,
      timeRemainingMs: Math.max(expiresAt - now, 0),
    };
  }

  static async processActivation(rawToken, newPassword, ipAddress) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const user = await User.findUserByActivationToken(hashedToken);

    if (!user)
      throw new Error(
        "This invitation link has expired. Please contact your Admin for a new invite.",
      );

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await User.activateUser(user.id, newPasswordHash);

    await logSecureAction(
      user.id,
      user.branch_id,
      "ACCOUNT_ACTIVATED_POLICY_SIGNED",
      "INFO",
      ipAddress,
      "users",
      user.id,
    );
  }

  static async verifyCustomerActivationToken(rawToken) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const user = await User.findCustomerByActivationToken(hashedToken);
    if (!user)
      throw new Error("This activation link is invalid or has expired.");
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

  static async processCustomerActivation(
    rawToken,
    newPassword,
    profileData,
    ipAddress,
  ) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Verify token and find the pending customer
    const user = await User.findCustomerByActivationToken(hashedToken);

    if (!user) {
      throw new Error("This activation link is invalid or has expired.");
    }

    // Hash the new password securely
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Execute the Atomic Transaction (Password + Profile + Vehicle)
    await User.activateCustomerWithProfile(
      user.id,
      newPasswordHash,
      profileData,
    );

    // Record the compliance event
    await logSecureAction(
      user.id,
      null,
      "CUSTOMER_ACCOUNT_ACTIVATED",
      "INFO",
      ipAddress,
      "users",
      user.id,
      null,
      {
        updated_make: profileData.make,
        updated_model: profileData.model,
      },
    );

    // Generate their first active session token
    const payload = {
      id: user.id,
      role: user.role,
      branchId: null,
      token_version: user.token_version + 1,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

    return { token, firstName: profileData.first_name };
  }
}

module.exports = AuthService;
