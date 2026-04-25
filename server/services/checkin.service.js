const crypto = require("crypto");
const CheckInModel = require("../models/CheckIn");
const { sendCustomerInviteEmail } = require("../utils/mailer");
const { logSecureAction } = require("../utils/auditLogger");

class CheckInService {
  static async searchPlate(plateNumber) {
    const cleanPlate = plateNumber.toUpperCase().trim();
    const vehicle = await CheckInModel.findVehicleByPlate(cleanPlate);
    return vehicle || null;
  }

  static async processCheckIn(data, staffUser, ipAddress) {
    const cleanPlate = data.plate_number.toUpperCase().trim();
    const existingVehicle = await CheckInModel.findVehicleByPlate(cleanPlate);

    // Predictive Maintenance Formula
    const predictiveOdometer = data.odometer + 5000;

    let resultData;
    let actionLog = "";
    let warningMessage = null;
    let inviteLink = null;

    if (existingVehicle) {
      // ODOMETER FRAUD CHECK
      if (data.odometer < existingVehicle.last_odometer_reading) {
        warningMessage =
          "Odometer Warning: New reading is lower than historical records. Please verify.";
      }

      resultData = await CheckInModel.checkInExisting(existingVehicle.id, {
        odometer: data.odometer,
        nextServiceOdo: predictiveOdometer,
        branchId: staffUser.branchId,
        staffId: staffUser.id,
        mechanicId: data.mechanic_id,
        serviceIntent: data.service_intent,
      });
      actionLog = "CHECK_IN_EXISTING_VEHICLE";
    } else {
      // --- NEW VEHICLE (HYBRID PATH A & B) WORKFLOW ---
      if (!data.email)
        throw new Error(
          "Email is required to generate the Digital Passport link.",
        );

      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      resultData = await CheckInModel.registerAndCheckInNew(
        data.email,
        cleanPlate,
        {
          hashedToken,
          firstName: data.first_name,
          lastName: data.last_name,
          make: data.make,
          model: data.model,
          year: data.year,
          odometer: data.odometer,
          nextServiceOdo: predictiveOdometer,
          branchId: staffUser.branchId,
          staffId: staffUser.id,
          mechanicId: data.mechanic_id,
          serviceIntent: data.service_intent,
        },
      );

      const frontendUrl =
        process.env.NODE_ENV === "development"
          ? process.env.FRONTEND_URL_DEV
          : process.env.FRONTEND_URL_PROD;
      inviteLink = `${frontendUrl}/activate-customer?token=${rawToken}`;

      // Fire-and-forget the email (doesn't block the UI if it takes a second)
      sendCustomerInviteEmail(data.email, cleanPlate, inviteLink).catch(
        console.error,
      );
      actionLog = "CHECK_IN_NEW_VEHICLE_REGISTRATION";
    }

    // Enterprise Audit Trail
    await logSecureAction(
      staffUser.id,
      staffUser.branchId,
      actionLog,
      "INFO",
      ipAddress,
      "job_cards",
      resultData.jobCardId,
      null,
      {
        plate: cleanPlate,
        odometer: data.odometer,
        target_next_service: predictiveOdometer,
        intent: data.service_intent,
      },
    );

    return {
      jobCardId: resultData.jobCardId,
      warning: warningMessage,
      magicLink: inviteLink,
    };
  }
}

module.exports = CheckInService;
