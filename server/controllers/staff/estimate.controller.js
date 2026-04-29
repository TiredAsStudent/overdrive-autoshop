const EstimateService = require("../../services/estimate.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class EstimateController {
  static async getEstimates(req, res) {
    try {
      const data = await EstimateService.getBranchEstimates(req.user.branchId);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Estimates retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async getEstimateDetails(req, res) {
    try {
      const data = await EstimateService.getEstimateDetails(
        req.params.id,
        req.user.branchId,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Estimate details retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async createEstimate(req, res) {
    try {
      const data = await EstimateService.createEstimate(
        req.body,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.CREATED,
        data,
        `Estimate ${data.reference_number} drafted successfully.`,
      );
    } catch (error) {
      // Differentiate between generic server issues and business logic blocks (like Low Stock)
      const statusCode = error.message.includes("Stock Error")
        ? STATUS_CODES.BAD_REQUEST
        : STATUS_CODES.INTERNAL_ERROR;
      return sendError(res, statusCode, error.message);
    }
  }

  static async updateStatus(req, res) {
    try {
      const data = await EstimateService.updateEstimateStatus(
        req.params.id,
        req.body.status,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        `Estimate marked as ${req.body.status}.`,
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }

  static async convertEstimate(req, res) {
    try {
      const data = await EstimateService.convertToSalesOrder(
        req.params.id,
        req.user,
        req.ip,
      );
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        data,
        "Quote successfully converted to active Sales Order. Inventory reserved.",
      );
    } catch (error) {
      const statusCode = error.message.includes("CRITICAL")
        ? STATUS_CODES.BAD_REQUEST
        : STATUS_CODES.INTERNAL_ERROR;
      return sendError(res, statusCode, error.message);
    }
  }
}

module.exports = EstimateController;
