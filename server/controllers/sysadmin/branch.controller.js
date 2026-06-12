const BranchService = require("../../services/sysadmin/branch.service");
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
        "Branch identity created successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getAllBranches(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 5;

      const result = await BranchService.getAllBranches(page, limit);

      return res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        data: result.branches,
        pagination: result.pagination,
        message: "Enterprise branches retrieved.",
      });
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve branches.",
      );
    }
  }

  static async getActiveBranches(req, res) {
    try {
      const branches = await BranchService.getActiveBranches();
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        branches,
        "Active branches retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to retrieve active branches.",
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
        "Branch profile retrieved.",
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
        "Branch legal identity updated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async toggleMaintenance(req, res) {
    try {
      const { is_maintenance_mode } = req.body;

      const branch = await BranchService.toggleMaintenance(
        req.params.id,
        is_maintenance_mode,
        req.user.id,
        req.ip,
      );

      const statusMsg = is_maintenance_mode
        ? "locked into Maintenance Mode"
        : "unlocked and operational";
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
        "Branch successfully archived.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = BranchController;
