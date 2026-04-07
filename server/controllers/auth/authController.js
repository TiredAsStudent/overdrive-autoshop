const AuthService = require("../../services/auth/authService");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

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
      return sendError(res, STATUS_CODES.UNAUTHORIZED, error.message);
    }
  }

  static async forgotPassword(req, res) {
    try {
      const email = req.body.email.trim();

      await AuthService.processForgotPassword(email);

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
}

module.exports = AuthController;
