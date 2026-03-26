const MechanicService = require("../services/mechanicService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

class MechanicController {
  static async register(req, res) {
    try {
      const { branchId, firstName, lastName, specialization } = req.body;
      if (!branchId || !firstName || !lastName) {
        return sendError(
          res,
          400,
          "Branch ID, First Name, and Last Name are required.",
        );
      }

      const mechanic = await MechanicService.registerMechanic(
        req.user.id,
        req.user.branchId,
        req.body,
        req.ip,
      );
      return sendSuccess(
        res,
        201,
        mechanic,
        "Mechanic successfully registered.",
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  static async getAll(req, res) {
    try {
      const mechanics = await MechanicService.getAllMechanics();
      return sendSuccess(
        res,
        200,
        mechanics,
        "Fetched all mechanics successfully.",
      );
    } catch (error) {
      return sendError(res, 500, "Failed to fetch mechanics.");
    }
  }

  static async getByBranch(req, res) {
    try {
      const mechanics = await MechanicService.getMechanicsForDropdown(
        req.user.role,
        req.user.branchId,
        req.params.branchId,
      );
      return sendSuccess(
        res,
        200,
        mechanics,
        "Fetched branch mechanics successfully.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  // --- UPDATE CONTROLLERS ---
  static async update(req, res) {
    try {
      const { branchId, firstName, lastName } = req.body;
      if (!branchId || !firstName || !lastName) {
        return sendError(
          res,
          400,
          "Branch ID, First Name, and Last Name are required.",
        );
      }

      const mechanic = await MechanicService.updateMechanic(
        req.user.id,
        req.user.branchId,
        req.params.id,
        req.body,
        req.ip,
      );
      return sendSuccess(
        res,
        200,
        mechanic,
        "Mechanic details updated successfully.",
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  static async toggleStatus(req, res) {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return sendError(res, 400, "isActive must be a boolean value.");
      }

      const mechanic = await MechanicService.toggleMechanicStatus(
        req.user.id,
        req.user.branchId,
        req.params.id,
        isActive,
        req.ip,
      );
      const message = isActive
        ? "Mechanic reactivated."
        : "Mechanic deactivated successfully.";

      return sendSuccess(res, 200, mechanic, message);
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }
}

module.exports = MechanicController;
