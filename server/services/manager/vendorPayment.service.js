const VendorPaymentModel = require("../../models/VendorPayment");
const SystemSettingModel = require("../../models/SystemSetting");
const VendorPaymentPdfService = require("../pdf/vendorPaymentPdf.service");
const { logSecureAction } = require("../../utils/auditLogger");
const fs = require("fs").promises;

class VendorPaymentService {
  static _verifyBranchAccess(payment, activeUser) {
    if (
      activeUser &&
      activeUser.role === "MANAGER" &&
      activeUser.branchId &&
      parseInt(payment.branch_id, 10) !== parseInt(activeUser.branchId, 10)
    ) {
      throw new Error(
        "Unauthorized: You do not have permission to access records from another branch.",
      );
    }
  }

  static async recordPayment(data, file, activeUser, ipAddress) {
    try {
      const requiresProof = [
        "CHECK",
        "GCASH",
        "MAYA",
        "BANK_TRANSFER",
      ].includes(data.payment_method);

      if (requiresProof && !file) {
        throw new Error(
          `Documentary proof (check scan/deposit slip) is mandatory for ${data.payment_method} transactions.`,
        );
      }

      if (file) {
        data.proof_of_payment_url = `uploads/vendor-payments/${file.filename}`;
      }

      let retries = 3;
      let result = null;

      while (retries > 0) {
        try {
          result = await VendorPaymentModel.recordPaymentTransaction(
            data,
            activeUser.id,
          );
          break;
        } catch (error) {
          if (
            error.code === "23505" &&
            error.constraint === "vendor_payments_payment_number_key"
          ) {
            retries--;
            if (retries === 0)
              throw new Error(
                "High system traffic. Failed to generate a unique Payment code.",
              );
          } else {
            throw error;
          }
        }
      }

      await logSecureAction(
        activeUser.id,
        result.payment.branch_id,
        "VENDOR_PAYMENT_DISBURSED",
        "WARNING",
        ipAddress,
        "bills",
        result.payment.bill_id,
        {
          previous_amount_paid:
            parseFloat(result.updatedBill.amount_paid) -
            parseFloat(result.payment.amount_paid),
        },
        {
          payment_number: result.payment.payment_number,
          amount_paid: result.payment.amount_paid,
          new_bill_status: result.updatedBill.payment_status,
          has_proof: !!result.payment.proof_of_payment_url,
        },
      );

      return result;
    } catch (error) {
      if (file) await fs.unlink(file.path).catch(console.error);
      throw error;
    }
  }

  static async voidPayment(id, activeUser, ipAddress) {
    const payment = await VendorPaymentModel.findById(id);
    if (!payment) throw new Error("Vendor payment record not found.");

    this._verifyBranchAccess(payment, activeUser);

    const result = await VendorPaymentModel.voidPayment(id);

    await logSecureAction(
      activeUser.id,
      payment.branch_id,
      "VENDOR_PAYMENT_VOIDED",
      "CRITICAL",
      ipAddress,
      "bills",
      payment.bill_id,
      { payment_status: "COMPLETED", amount: payment.amount_paid },
      { payment_status: "VOID", amount_reverted: payment.amount_paid },
    );

    return result;
  }

  static async getPaymentDetails(id, activeUser = null) {
    const payment = await VendorPaymentModel.findById(id);
    if (!payment) throw new Error("Vendor payment record not found.");

    this._verifyBranchAccess(payment, activeUser);

    return payment;
  }

  static async getPayments(
    page = 1,
    limit = 10,
    search = "",
    method = "all",
    branchId = "all",
    vendorId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, payments] = await Promise.all([
      VendorPaymentModel.countFiltered(search, method, branchId, vendorId),
      VendorPaymentModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        method,
        branchId,
        vendorId,
      ),
    ]);

    return {
      payments,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async getEligibleBillsForVendor(vendorId) {
    return await VendorPaymentModel.findEligibleBillsByVendor(vendorId);
  }

  static async generatePaymentPdf(id, activeUser, ipAddress) {
    const payment = await VendorPaymentModel.findById(id);
    if (!payment) throw new Error("Vendor payment record not found.");

    this._verifyBranchAccess(payment, activeUser);

    const settings = await SystemSettingModel.getSettings();
    const pdfBuffer = await VendorPaymentPdfService.generate(payment, settings);

    await logSecureAction(
      activeUser.id,
      payment.branch_id,
      "VENDOR_PAYMENT_PDF_GENERATED",
      "INFO",
      ipAddress,
      "vendor_payments",
      payment.id,
      null,
      { payment_number: payment.payment_number, status: payment.status },
    );

    return {
      pdfBuffer,
      paymentNumber: payment.payment_number,
    };
  }
}

module.exports = VendorPaymentService;
