const crypto = require("crypto");
const User = require("../models/User");
const { sendWelcomeInviteEmail } = require("../utils/mailer");

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

    const newUser = await User.createUserAndLogAudit(
      adminUser.id,
      adminUser.branchId,
      userData,
      hashedToken,
      ipAddress,
    );

    const frontendUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;
    const inviteLink = `${frontendUrl}/activate?token=${rawToken}`;

    // Fire and forget email
    sendWelcomeInviteEmail(
      userData.email,
      userData.firstName,
      userData.role,
      inviteLink,
    ).catch(console.error);

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
      branchId: updates.branchId !== undefined ? updates.branchId : null,
      isActive: updates.isActive !== undefined ? updates.isActive : null,
      role: updates.role !== undefined ? updates.role : null,
      firstName: updates.firstName !== undefined ? updates.firstName : null,
      lastName: updates.lastName !== undefined ? updates.lastName : null,
      email: updates.email !== undefined ? updates.email : null,
    };

    await User.updateUserAndLogAudit(
      adminUser.id,
      adminUser.branchId,
      targetUserId,
      sanitizedUpdates,
      ipAddress,
    );
  }

  static async executeKillSwitch(adminUser, targetUserId, ipAddress) {
    const targetUser = await User.incrementTokenVersion(
      adminUser.id,
      adminUser.branchId,
      targetUserId,
      ipAddress,
    );
    if (!targetUser) throw new Error("User not found.");
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
      adminUser.id,
      adminUser.branchId,
      targetUserId,
      hashedToken,
      ipAddress,
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

    return { message: `New invitation securely sent to ${user.email}` };
  }
}

module.exports = UserService;
