const VendorPaymentModel = require("../../models/VendorPayment");
const { logSecureAction } = require("../../utils/auditLogger");
const fs = require("fs").promises;

class VendorPaymentService {
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
        data.proof_of_payment_url = file.path.replace(/\\/g, "/");
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
        "WARNING", // Flagged as warning because cash left the business
        ipAddress,
        "bills",
        result.payment.bill_id,
        {
          payment_status: "PREVIOUS",
          previous_amount_paid: result.payment.amount_paid,
        }, // Masked for brevity
        {
          payment_number: result.payment.payment_number,
          amount_paid: result.payment.amount_paid,
          new_bill_status: result.updatedBill.payment_status,
          has_proof: !!result.payment.proof_of_payment_url,
        },
      );

      return result;
    } catch (error) {
      if (file) await fs.unlink(file.path).catch(console.error); // Safe Cleanup
      throw error;
    }
  }

  static async getPaymentDetails(id) {
    const payment = await VendorPaymentModel.findById(id);
    if (!payment) throw new Error("Vendor payment record not found.");
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
}

module.exports = VendorPaymentService;
