const crypto = require("crypto");
const CheckInModel = require("../models/CheckIn");
const User = require("../models/User");
const {
  sendCustomerInviteEmail,
  sendNewVehicleSecurityAlert,
} = require("../utils/mailer");
const { logSecureAction } = require("../utils/auditLogger");

class CheckInService {
  // PLATE SANITIZATION: Strips spaces and symbols (ABC-123 -> ABC123)
  static sanitizePlate(plate) {
    return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  }

  static async searchPlate(plateNumber) {
    const cleanPlate = this.sanitizePlate(plateNumber);
    const vehicle = await CheckInModel.findVehicleByPlate(cleanPlate);
    return vehicle || null;
  }

  static async processCheckIn(data, staffUser, ipAddress) {
    const cleanPlate = this.sanitizePlate(data.plate_number);
    const existingVehicle = await CheckInModel.findVehicleByPlate(cleanPlate);
    const predictiveOdometer = data.odometer + 5000;

    let resultData;
    let actionLog = "";
    let warningMessage = null;
    let inviteLink = null;

    if (existingVehicle) {
      if (data.odometer < existingVehicle.last_odometer_reading) {
        warningMessage =
          "Odometer Warning: New reading is lower than historical records.";
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
      // --- NEW VEHICLE WORKFLOW ---
      // Email is guaranteed by Zod validation schema
      const existingCustomer = await User.findUserByEmail(data.email);

      if (existingCustomer) {
        // SCENARIO: Existing Customer brings a 2nd car.
        resultData = await CheckInModel.linkNewVehicleToExisting(
          existingCustomer.id,
          cleanPlate,
          {
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

        // Trigger the anti-spoofing security email
        sendNewVehicleSecurityAlert(existingCustomer.email, cleanPlate).catch(
          console.error,
        );

        warningMessage =
          "Linked to an existing Customer Account. Security Alert sent to owner.";
        actionLog = "CHECK_IN_NEW_VEHICLE_EXISTING_OWNER";
      } else {
        // SCENARIO: Brand New Customer (Guaranteed Portal Account)
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
        sendCustomerInviteEmail(data.email, cleanPlate, inviteLink).catch(
          console.error,
        );

        actionLog = "CHECK_IN_NEW_VEHICLE_REGISTRATION";
      }
    }

    // Dynamic severity based on the odometer fraud warning
    const logSeverity =
      warningMessage && warningMessage.includes("Odometer Warning")
        ? "WARNING"
        : "INFO";

    await logSecureAction(
      staffUser.id,
      staffUser.branchId,
      actionLog,
      logSeverity,
      ipAddress,
      "job_cards",
      resultData.jobCardId,
      null,
      { plate: cleanPlate, odometer: data.odometer, warning: warningMessage },
    );
    return {
      jobCardId: resultData.jobCardId,
      warning: warningMessage,
      magicLink: inviteLink,
    };
  }
}

module.exports = CheckInService;
