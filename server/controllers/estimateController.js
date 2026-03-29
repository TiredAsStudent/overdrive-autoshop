const EstimateService = require("../services/estimateService");
const EstimateModel = require("../models/estimateModel");
const { sendSuccess, sendError } = require("../utils/responseHandler");

class EstimateController {
  static async createEstimate(req, res) {
    try {
      const { customerName, items } = req.body;
      if (!customerName)
        return sendError(res, 400, "Customer Name is required.");

      const estimate = await EstimateService.generateDraftEstimate(
        req.user.id,
        req.user.branchId,
        req.body,
        req.ip,
      );
      return sendSuccess(
        res,
        201,
        estimate,
        "Draft estimate generated successfully.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  static async getBranchEstimates(req, res) {
    try {
      const estimates = await EstimateModel.getEstimatesByBranch(
        req.user.branchId,
      );
      return sendSuccess(
        res,
        200,
        estimates,
        "Fetched branch estimates successfully.",
      );
    } catch (error) {
      return sendError(res, 500, "Failed to fetch estimates.");
    }
  }

  static async getEstimateDetails(req, res) {
    try {
      const estimate = await EstimateModel.getEstimateWithDetails(
        req.params.id,
        req.user.branchId,
      );
      if (!estimate) return sendError(res, 404, "Estimate not found.");
      return sendSuccess(
        res,
        200,
        estimate,
        "Fetched estimate details successfully.",
      );
    } catch (error) {
      return sendError(res, 500, "Failed to fetch estimate details.");
    }
  }

  static async changeStatus(req, res) {
    try {
      const { status } = req.body;
      if (!["APPROVED", "REJECTED"].includes(status)) {
        return sendError(res, 400, "Status must be APPROVED or REJECTED.");
      }

      const estimate = await EstimateService.updateStatus(
        req.user.id,
        req.user.branchId,
        req.params.id,
        status,
        req.ip,
      );
      return sendSuccess(
        res,
        200,
        estimate,
        `Estimate status updated to ${status}.`,
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  // --- SALES ORDER (WIP) ---
  static async convertToWip(req, res) {
    try {
      const result = await EstimateService.convertToWip(
        req.user.id,
        req.user.branchId,
        req.params.id,
        req.ip,
      );
      return sendSuccess(
        res,
        200,
        result,
        "Job Started: Estimate converted to WIP and parts securely reserved.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  // --- FINAL INVOICE & PAYMENT ---
  static async payInvoice(req, res) {
    try {
      const { amount, method, referenceNumber } = req.body;

      if (!amount || !method) {
        return sendError(res, 400, "Payment amount and method are required.");
      }

      const validMethods = ["CASH", "GCASH", "BANK_TRANSFER"];
      if (!validMethods.includes(method)) {
        return sendError(res, 400, "Invalid payment method.");
      }

      const result = await EstimateService.processPayment(
        req.user.id,
        req.user.branchId,
        req.params.id,
        req.body,
        req.ip,
      );

      return sendSuccess(
        res,
        200,
        result,
        "Payment successful! Invoice locked and inventory permanently updated.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }
}

module.exports = EstimateController;
