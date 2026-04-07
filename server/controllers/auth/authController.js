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
}

module.exports = AuthController;
