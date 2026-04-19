const BranchModel = require("../../models/Branch");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class BranchController {
  static async getBranches(req, res) {
    try {
      const branches = await BranchModel.getAllBranches();
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
        error.message,
      );
    }
  }
}

module.exports = BranchController;
