const BranchService = require("../../services/branch.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class BranchController {
  static async createBranch(req, res) {
    try {
      const branch = await BranchService.createBranch(
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        branch,
        "Branch created successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getAllBranches(req, res) {
    try {
      const branches = await BranchService.getAllBranches();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        branches,
        "Branches retrieved successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve branches.",
      );
    }
  }

  static async getBranch(req, res) {
    try {
      const branch = await BranchService.getBranchById(req.params.id);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        branch,
        "Branch retrieved successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.NOT_FOUND, error.message);
    }
  }

  static async updateBranch(req, res) {
    try {
      const branch = await BranchService.updateBranch(
        req.params.id,
        req.body,
        req.user.id,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        branch,
        "Branch updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async toggleMaintenance(req, res) {
    try {
      const { is_maintenance_mode } = req.body;
      // Passed req.user.id and req.ip for traceability
      const branch = await BranchService.toggleMaintenanceMode(
        req.params.id,
        is_maintenance_mode,
        req.user.id,
        req.ip,
      );

      const statusMsg = is_maintenance_mode
        ? "locked into Maintenance Mode"
        : "unlocked and active";
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        branch,
        `Branch successfully ${statusMsg}.`,
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async deleteBranch(req, res) {
    try {
      await BranchService.deleteBranch(req.params.id, req.user.id, req.ip);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        null,
        "Branch successfully removed from active registry.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = BranchController;
