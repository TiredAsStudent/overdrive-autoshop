const AuthService = require("../services/authService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

class AuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return sendError(res, 400, "Email and password are required.");
      const data = await AuthService.loginWithEmail(email, password, req.ip);
      return sendSuccess(res, 200, data, "Login successful.");
    } catch (error) {
      return sendError(res, 401, error.message);
    }
  }

  static async googleLogin(req, res) {
    try {
      const { googleToken } = req.body;
      if (!googleToken) return sendError(res, 400, "Google token is required.");
      const data = await AuthService.loginWithGoogle(googleToken, req.ip);
      return sendSuccess(res, 200, data, "Google Login successful.");
    } catch (error) {
      return sendError(res, 401, error.message);
    }
  }

  static async inviteUser(req, res) {
    try {
      const adminId = req.user.id;
      const { email, role, branchId } = req.body;
      if (!email || !role || !branchId)
        return sendError(res, 400, "Email, role, and branchId are required.");
      const inviteData = await AuthService.inviteStaff(
        adminId,
        email,
        role,
        branchId,
        req.ip,
      );
      return sendSuccess(
        res,
        201,
        inviteData,
        "Security invitation link generated successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        500,
        "Failed to generate invitation.",
        error.message,
      );
    }
  }

  //Customer Registration
  static async inviteCustomer(req, res) {
    try {
      const staffId = req.user.id;
      const { email, branchId } = req.body;

      if (!email || !branchId)
        return sendError(
          res,
          400,
          "Customer email and branch ID are required.",
        );

      const inviteData = await AuthService.inviteCustomer(
        staffId,
        email,
        branchId,
        req.ip,
      );
      return sendSuccess(
        res,
        201,
        inviteData,
        "Customer Welcome Link generated successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        500,
        "Failed to generate customer link.",
        error.message,
      );
    }
  }

  static async setupAccount(req, res) {
    try {
      const { token, password, firstName, lastName } = req.body;
      if (!token || !password || !firstName || !lastName) {
        return sendError(
          res,
          400,
          "Token, password, first name, and last name are required.",
        );
      }
      const data = await AuthService.setupAccount(
        token,
        password,
        firstName,
        lastName,
        req.ip,
      );
      return sendSuccess(res, 201, data, "Account successfully created.");
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }
}

module.exports = AuthController;
