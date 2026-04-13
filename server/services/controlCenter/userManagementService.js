const crypto = require("crypto");
const UserManagementModel = require("../../models/controlCenter/userManagementModel");
const { sendWelcomeInviteEmail } = require("../../utils/mailer");

class UserManagementService {
  static async processNewInvite(adminUser, userData, ipAddress) {
    // Verify email uniqueness
    const existingUser = await UserManagementModel.checkEmailExists(
      userData.email,
    );
    if (existingUser) {
      if (existingUser.password_hash) {
        throw new Error("A user with this email is already fully registered.");
      }
      throw new Error(
        "An invitation has already been sent to this email. Please revoke or resend the existing invite.",
      );
    }

    // Generate the 2-Hour Security Token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Save to Database atomically
    const newUser = await UserManagementModel.createUserAndLogAudit(
      adminUser.id,
      adminUser.branchId, // This comes from your branchMiddleware
      userData,
      hashedToken,
      ipAddress,
    );

    // Construct URL and send email
    const frontendUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    const inviteLink = `${frontendUrl}/activate?token=${rawToken}`;

    // Fire and forget the email to avoid blocking the API response
    sendWelcomeInviteEmail(
      userData.email,
      userData.firstName,
      userData.role,
      inviteLink,
    ).catch((err) => {
      console.error("Failed to send welcome email:", err);
    });

    return {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      status: "PENDING_ACTIVATION",
    };
  }

  static async getLiveRoster() {
    return await UserManagementModel.getAllUsers();
  }

  static async updateEmployeeProfile(
    adminUser,
    targetUserId,
    updates,
    ipAddress,
  ) {
    // Ensure we don't accidentally wipe out data if fields are missing
    const sanitizedUpdates = {
      branchId: updates.branchId !== undefined ? updates.branchId : null,
      isActive: updates.isActive !== undefined ? updates.isActive : null,
    };

    await UserManagementModel.updateUserAndLogAudit(
      adminUser.id,
      adminUser.branchId,
      targetUserId,
      sanitizedUpdates,
      ipAddress,
    );
  }

  static async processResendInvite(adminUser, targetUserId, ipAddress) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Atomic update and log
    const user = await UserManagementModel.regenerateActivationToken(
      adminUser.id,
      adminUser.branchId,
      targetUserId,
      hashedToken,
      ipAddress,
    );

    // Construct URL and send email
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
    ).catch((err) => {
      console.error("Failed to resend welcome email:", err);
    });

    return { message: "New invitation sent to " + user.email };
  }
}

module.exports = UserManagementService;
