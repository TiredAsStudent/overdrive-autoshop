const crypto = require("crypto");
const User = require("../models/User");
const { sendWelcomeInviteEmail } = require("../utils/mailer");
const { logSecureAction } = require("../utils/auditLogger");

class UserService {
  static async processNewInvite(adminUser, userData, ipAddress) {
    const existingUser = await User.checkEmailExists(userData.email);
    if (existingUser) {
      if (existingUser.password_hash)
        throw new Error("A user with this email is already fully registered.");
      throw new Error("An invitation has already been sent to this email.");
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const newUser = await User.createUser(userData, hashedToken);

    const frontendUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;
    const inviteLink = `${frontendUrl}/activate?token=${rawToken}`;

    sendWelcomeInviteEmail(
      userData.email,
      userData.firstName,
      userData.role,
      inviteLink,
    ).catch(console.error);

    await logSecureAction(
      adminUser.id,
      adminUser.branchId,
      `INVITED_NEW_${userData.role}`,
      "WARNING",
      ipAddress,
      "users",
      newUser.id,
      null,
      { new_email: userData.email },
    );

    return {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      status: "PENDING_ACTIVATION",
    };
  }

  static async getLiveRoster() {
    return await User.getAllUsers();
  }

  static async updateEmployeeProfile(
    adminUser,
    targetUserId,
    updates,
    ipAddress,
  ) {
    const sanitizedUpdates = {
      branch_id: updates.branchId !== undefined ? updates.branchId : undefined,
      is_active: updates.isActive !== undefined ? updates.isActive : undefined,
      role: updates.role !== undefined ? updates.role : undefined,
      first_name:
        updates.firstName !== undefined ? updates.firstName : undefined,
      last_name: updates.lastName !== undefined ? updates.lastName : undefined,
      email: updates.email !== undefined ? updates.email : undefined,
    };

    await User.updateUser(targetUserId, sanitizedUpdates);

    let actionStr = "UPDATED_USER_PROFILE";
    let severity = "INFO";
    if (updates.isActive === false) {
      actionStr = "DEACTIVATED_USER_ACCOUNT";
      severity = "WARNING";
    }

    await logSecureAction(
      adminUser.id,
      adminUser.branchId,
      actionStr,
      severity,
      ipAddress,
      "users",
      targetUserId,
      null,
      sanitizedUpdates,
    );
  }

  static async executeKillSwitch(adminUser, targetUserId, ipAddress) {
    const targetUser = await User.incrementTokenVersion(targetUserId);
    if (!targetUser) throw new Error("User not found.");

    await logSecureAction(
      adminUser.id,
      adminUser.branchId,
      "TRIGGERED_SESSION_KILL_SWITCH",
      "CRITICAL",
      ipAddress,
      "users",
      targetUserId,
    );

    return {
      message:
        "Session Kill-Switch activated. All active tokens for this user are now invalid.",
    };
  }

  static async processResendInvite(adminUser, targetUserId, ipAddress) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await User.regenerateActivationToken(
      targetUserId,
      hashedToken,
    );

    const frontendUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;
    const inviteLink = `${frontendUrl}/activate?token=${rawToken}`;

    sendWelcomeInviteEmail(
      user.email,
      user.first_name,
      user.role,
      inviteLink,
    ).catch(console.error);

    await logSecureAction(
      adminUser.id,
      adminUser.branchId,
      "RESENT_INVITATION",
      "INFO",
      ipAddress,
      "users",
      targetUserId,
    );

    return { message: `New invitation securely sent to ${user.email}` };
  }
}

module.exports = UserService;
