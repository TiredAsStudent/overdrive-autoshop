const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const db = require("../config/db");
const UserModel = require("../models/userModel");
const InvitationModel = require("../models/invitationModel");
const AuditModel = require("../models/auditModel");
const EmailService = require("./emailService");

// Initialize Google Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  static async loginWithEmail(email, password, ipAddress) {
    const user = await UserModel.findByEmail(email);
    if (!user || !user.password_hash)
      throw new Error("Invalid credentials or account requires Google Login.");

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new Error("Invalid credentials");

    const payload = { id: user.id, role: user.role, branchId: user.branch_id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

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

  static async loginWithGoogle(googleToken, ipAddress) {
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const user = await UserModel.findByEmail(payload.email);
    if (!user)
      throw new Error(
        "Email not registered in the system. Please complete registration first.",
      );

    if (!user.google_id) await UserModel.linkGoogleId(user.id, payload.sub);

    const jwtPayload = {
      id: user.id,
      role: user.role,
      branchId: user.branch_id,
    };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

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

  static async inviteStaff(adminId, email, role, branchId, ipAddress) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 Hours

    const invite = await InvitationModel.create(
      email,
      role,
      branchId,
      tokenHash,
      expiresAt,
      adminId,
    );

    const adminUser = await UserModel.findById(adminId);
    await AuditModel.log(
      adminId,
      adminUser.branch_id,
      "GENERATED_STAFF_INVITE",
      "user_invitations",
      invite.id,
      ipAddress,
    );

    const frontendUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    const inviteLink = `${frontendUrl}/setup-account?token=${token}`;

    //Attempt to send the automatic email
    try {
      await EmailService.sendInvitation(email, inviteLink, role);
    } catch (error) {
      console.log(
        "Proceeding without email. Link will be provided to the frontend.",
      );
    }

    return { inviteLink, expiresAt };
  }

  static async inviteCustomer(staffId, email, branchId, ipAddress) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const invite = await InvitationModel.createCustomerInvite(
      email,
      branchId,
      tokenHash,
      staffId,
    );

    const staffUser = await UserModel.findById(staffId);
    await AuditModel.log(
      staffId,
      staffUser.branch_id,
      "GENERATED_CUSTOMER_INVITE",
      "user_invitations",
      invite.id,
      ipAddress,
    );

    const frontendUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    const inviteLink = `${frontendUrl}/welcome?token=${token}`;

    //Attempt to send the automatic email
    try {
      await EmailService.sendInvitation(email, inviteLink, "CUSTOMER");
    } catch (error) {
      console.log(
        "Proceeding without email. Link will be provided to the frontend.",
      );
    }

    return { inviteLink, expiresAt: "Never" };
  }

  static async setupAccount(
    rawToken,
    newPassword,
    firstName,
    lastName,
    ipAddress,
  ) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const invitation = await InvitationModel.findByTokenHash(tokenHash);

    if (!invitation) throw new Error("Invalid or missing invitation token.");
    if (invitation.is_used)
      throw new Error("This invitation has already been used.");

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      throw new Error("This invitation has expired.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      let newUser;
      if (invitation.role === "CUSTOMER") {
        newUser = await UserModel.createCustomer(
          invitation.branch_id,
          invitation.email,
          passwordHash,
          firstName,
          lastName,
          client,
        );
      } else {
        newUser = await UserModel.createStaff(
          invitation.branch_id,
          invitation.role,
          invitation.email,
          passwordHash,
          firstName,
          lastName,
          client,
        );
      }

      await InvitationModel.markAsUsed(invitation.id, client);
      await AuditModel.log(
        newUser.id,
        newUser.branch_id,
        "ACCOUNT_SETUP",
        "users",
        newUser.id,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return { email: newUser.email, role: newUser.role };
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(
        "Failed to setup account due to an internal error. Transaction rolled back.",
      );
    } finally {
      client.release();
    }
  }
}

module.exports = AuthService;
