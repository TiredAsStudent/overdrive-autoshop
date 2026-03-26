const VehicleService = require("../services/vehicleService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

class VehicleController {
  static async checkIn(req, res) {
    try {
      const {
        plateNumber,
        make,
        model,
        ownerFirstName,
        ownerLastName,
        ownerEmail,
      } = req.body;

      // Strict validation for required fields
      if (
        !plateNumber ||
        !make ||
        !model ||
        !ownerFirstName ||
        !ownerLastName ||
        !ownerEmail
      ) {
        return sendError(
          res,
          400,
          "Missing required fields for Integrated Check-In.",
        );
      }

      const result = await VehicleService.integratedCheckIn(
        req.user.id,
        req.user.branchId,
        req.body,
        req.ip,
      );

      return sendSuccess(res, 201, result, result.message);
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  static async getRecord(req, res) {
    try {
      const { plateNumber } = req.params;
      const record = await VehicleService.searchMedicalRecord(plateNumber);

      return sendSuccess(
        res,
        200,
        record,
        "Medical record fetched successfully.",
      );
    } catch (error) {
      return sendError(res, 404, error.message);
    }
  }
}

module.exports = VehicleController;
