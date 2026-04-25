const CheckInService = require("../../services/checkin.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class CheckInController {
  static async searchPlate(req, res) {
    try {
      const data = await CheckInService.searchPlate(req.params.plate);

      if (!data) {
        return sendSuccess(
          res,
          STATUS_CODES.SUCCESS,
          { isFound: false },
          "Vehicle not found. Proceed to Registration.",
        );
      }

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        { isFound: true, vehicle: data },
        "Vehicle Medical Record retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.INTERNAL_ERROR, error.message);
    }
  }

  static async submitCheckIn(req, res) {
    try {
      const data = await CheckInService.processCheckIn(
        req.body,
        req.user,
        req.ip,
      );

      let msg = "Vehicle successfully checked into the Workshop Bay.";
      if (data.warning) msg += ` ${data.warning}`;

      return sendSuccess(res, STATUS_CODES.CREATED, data, msg);
    } catch (error) {
      return sendError(res, STATUS_CODES.BAD_REQUEST, error.message);
    }
  }
}

module.exports = CheckInController;
