const AuthService = require("../../services/auth.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");
const { logSecureAction } = require("../../utils/auditLogger");

class AuthController {
  static async login(req, res) {
    try {
      const email = req.body.email?.trim();
      const password = req.body.password;

      if (!email || !password) {
        return sendError(
          res,
          STATUS_CODES.BAD_REQUEST,
          "Email and password are required.",
        );
      }

      const data = await AuthService.loginWithEmail(email, password, req.ip);
      return sendSuccess(res, STATUS_CODES.SUCCESS, data, "Login successful.");
    } catch (error) {
      await logSecureAction(
        null,
        null,
        `LOGIN_FAILED: ${error.message}`,
        "WARNING",
        req.ip,
        null,
        null,
      );
      return sendError(res, STATUS_CODES.UNAUTHORIZED, error.message);
    }
  }

  static async googleLogin(req, res) {
    try {
      const { googleToken } = req.body;
      if (!googleToken) {
        return sendError(
          res,
          STATUS_CODES.BAD_REQUEST,
          "Google token is required.",
        );
      }
      const data = await AuthService.loginWithGoogle(googleToken, req.ip);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Google Login successful.",
      );
    } catch (error) {
      await logSecureAction(
        null,
        null,
        `GOOGLE_LOGIN_FAILED: ${error.message}`,
        "WARNING",
        req.ip,
        null,
        null,
      );
      return sendError(res, STATUS_CODES.UNAUTHORIZED, error.message);
    }
  }

  static async forgotPassword(req, res) {
    try {
      const email = req.body.email.trim();
      await AuthService.processForgotPassword(email, req.ip);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        null,
        `If an account exists for ${email}, a recovery link has been sent.`,
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "An error occurred while processing your request.",
      );
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      await AuthService.processResetPassword(token, newPassword, req.ip);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        null,
        "Password has been successfully reset. You may now log in.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async verifyResetToken(req, res) {
    try {
      const { token } = req.params;
      await AuthService.verifyResetToken(token);
      return sendSuccess(res, STATUS_CODES.SUCCESS, null, "Token is valid.");
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async verifyInvite(req, res) {
    try {
      const { token } = req.params;
      const data = await AuthService.verifyActivationToken(token);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Invite verified successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async activateAccount(req, res) {
    try {
      const { token, newPassword, policyAgreed } = req.body;
      if (!policyAgreed) {
        return sendError(
          res,
          STATUS_CODES.BAD_REQUEST,
          "You must agree to the Data Integrity Policy to activate your account.",
        );
      }
      await AuthService.processActivation(token, newPassword, req.ip);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        null,
        "Account successfully activated! You may now log in.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = AuthController;
