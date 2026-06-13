const crypto = require("crypto");
const User = require("../../models/User");
const { sendWelcomeInviteEmail } = require("../../utils/mailer");
const { logSecureAction } = require("../../utils/auditLogger");

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

    // Async email send
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
      { new_email: userData.email, assigned_branch: userData.branchId },
    );

    return {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      status: "PENDING_ACTIVATION",
    };
  }

  static async getLiveRoster(page = 1, limit = 5, search = "") {
    const offset = (page - 1) * limit;

    const [totalItems, users] = await Promise.all([
      User.countFilteredRoster(search),
      User.findPaginatedRoster(limit, offset, search),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      users,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async updateEmployeeProfile(
    adminUser,
    targetUserId,
    updates,
    ipAddress,
  ) {
    // Self-Preservation Check: Admin cannot demote or deactivate themselves
    if (
      adminUser.id === targetUserId &&
      (updates.isActive === false || updates.role !== "ADMIN")
    ) {
      throw new Error(
        "Security Violation: You cannot deactivate or demote your own active Administrator session.",
      );
    }

    const oldUser = await User.findUserById(targetUserId);
    if (!oldUser) throw new Error("User not found.");

    const sanitizedUpdates = {
      branch_id: updates.branchId !== undefined ? updates.branchId : undefined,
      is_active: updates.isActive !== undefined ? updates.isActive : undefined,
      role: updates.role !== undefined ? updates.role : undefined,
      first_name:
        updates.firstName !== undefined ? updates.firstName : undefined,
      last_name: updates.lastName !== undefined ? updates.lastName : undefined,
      email: updates.email !== undefined ? updates.email : undefined,
    };

    const updatedUser = await User.updateUser(targetUserId, sanitizedUpdates);

    let actionStr = "UPDATED_USER_PROFILE";
    let severity = "INFO";

    if (updates.isActive === false) {
      actionStr = "DEACTIVATED_USER_ACCOUNT";
      severity = "CRITICAL";
      // Auto-trigger the Session Kill Switch if deactivated
      await User.incrementTokenVersion(targetUserId);
    } else if (updates.branchId !== oldUser.branch_id) {
      actionStr = "BRANCH_TRANSFER_EXECUTED";
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
      {
        branch_id: oldUser.branch_id,
        is_active: oldUser.is_active,
        role: oldUser.role,
      },
      {
        branch_id: updatedUser.branch_id,
        is_active: updatedUser.is_active,
        role: updatedUser.role,
      },
    );
  }

  static async executeKillSwitch(adminUser, targetUserId, ipAddress) {
    // Self-Preservation Check: Admin cannot kill their own token from here
    if (adminUser.id === targetUserId) {
      throw new Error(
        "Invalid Action: You cannot kill your own active session from the dashboard. Please use the Logout button.",
      );
    }

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
        "Session Kill-Switch activated. All active browser tokens for this user are now invalidated.",
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

    return { message: `New secure invitation link sent to ${user.email}` };
  }
}

module.exports = UserService;
