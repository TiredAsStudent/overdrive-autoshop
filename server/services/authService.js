const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const UserModel = require("../models/userModel");
const InvitationModel = require("../models/invitationModel");
const AuditModel = require("../models/auditModel");

// Initialize Google Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  //Standard Email/Password Login
  static async loginWithEmail(email, password, ipAddress) {
    const user = await UserModel.findByEmail(email);

    if (!user || !user.password_hash) {
      throw new Error("Invalid credentials or account requires Google Login.");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new Error("Invalid credentials");

    const payload = { id: user.id, role: user.role, branchId: user.branch_id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

    // Inject Immutable Audit Trail
    await AuditModel.log(
      user.id,
      user.branch_id,
      "LOGIN_SUCCESS_EMAIL",
      "users",
      user.id,
      ipAddress,
    );

    delete user.password_hash;
    return { user, token };
  }

  //Google OAuth 2.0 (Hybrid Login)
  static async loginWithGoogle(googleToken, ipAddress) {
    // Verify token with Google's servers
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    // Check if email exists in our DB
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error(
        "Email not registered in the system. Please contact the Admin.",
      );
    }

    // Link Google ID if it's their first time logging in with Google
    if (!user.google_id) {
      await UserModel.linkGoogleId(user.id, payload.sub);
    }

    const jwtPayload = {
      id: user.id,
      role: user.role,
      branchId: user.branch_id,
    };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

    // Inject Immutable Audit Trail
    await AuditModel.log(
      user.id,
      user.branch_id,
      "LOGIN_SUCCESS_GOOGLE",
      "users",
      user.id,
      ipAddress,
    );

    delete user.password_hash;
    return { user, token };
  }

  //Generate 2-Hour Security Link
  static async inviteStaff(adminId, email, role, branchId, ipAddress) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const invite = await InvitationModel.create(
      email,
      role,
      branchId,
      tokenHash,
      expiresAt,
      adminId,
    );

    // Inject Immutable Audit Trail
    // Admin context required to log who created the invite
    const adminUser = await UserModel.findById(adminId);
    await AuditModel.log(
      adminId,
      adminUser.branch_id,
      "GENERATED_INVITE",
      "user_invitations",
      invite.id,
      ipAddress,
    );

    const inviteLink = `${process.env.FRONTEND_URL_PROD}/setup-account?token=${token}`;
    return { inviteLink, expiresAt };
  }

  //Setup Account
  static async setupAccount(
    rawToken,
    newPassword,
    firstName,
    lastName,
    ipAddress,
  ) {
    // Hash the raw token from the URL to match the DB
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const invitation = await InvitationModel.findByTokenHash(tokenHash);

    if (!invitation) throw new Error("Invalid or missing invitation token.");
    if (invitation.is_used)
      throw new Error("This invitation has already been used.");
    if (new Date(invitation.expires_at) < new Date())
      throw new Error("This invitation has expired.");

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Create the user in the database
    const newUser = await UserModel.createStaff(
      invitation.branch_id,
      invitation.role,
      invitation.email,
      passwordHash,
      firstName,
      lastName,
    );

    // Mark invitation as used
    await InvitationModel.markAsUsed(invitation.id);

    // Inject Immutable Audit Trail
    await AuditModel.log(
      newUser.id,
      newUser.branch_id,
      "ACCOUNT_SETUP",
      "users",
      newUser.id,
      ipAddress,
    );

    return { email: newUser.email, role: newUser.role };
  }
}

module.exports = AuthService;
