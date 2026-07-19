const EstimateService = require("../../services/staff/estimate.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class EstimateController {
  static async createEstimate(req, res) {
    try {
      const estimate = await EstimateService.createEstimate(
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        estimate,
        "Estimate quotation generated successfully.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async updateEstimate(req, res) {
    try {
      const estimate = await EstimateService.updateEstimate(
        req.params.id,
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        estimate,
        "Estimate successfully updated.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async getEstimates(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      let { search, status, branch } = req.query;

      if (req.user.role === "STAFF") branch = req.user.branchId;

      const result = await EstimateService.getEstimates(
        page,
        limit,
        search,
        status,
        branch,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Estimates retrieved.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch estimates.",
        error.message,
      );
    }
  }

  static async getEstimateDetails(req, res) {
    try {
      const estimate = await EstimateService.getEstimateDetails(
        req.params.id,
        req.user,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        estimate,
        "Estimate profile retrieved.",
      );
    } catch (error) {
      const code = error.message.includes("Unauthorized")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.NOT_FOUND;
      return sendError(res, code, error.message);
    }
  }

  static async updateStatus(req, res) {
    try {
      const estimate = await EstimateService.updateEstimateStatus(
        req.params.id,
        req.body.status,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        estimate,
        `Estimate successfully marked as ${req.body.status}.`,
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = EstimateController;
