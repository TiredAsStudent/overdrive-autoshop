const PaymentModel = require("../../models/Payment");
const InvoiceModel = require("../../models/Invoice");
const { logSecureAction } = require("../../utils/auditLogger");
const fs = require("fs").promises;

class PaymentService {
  static async recordPayment(data, file, activeUser, ipAddress) {
    const invoice = await InvoiceModel.findById(data.invoice_id);

    if (!invoice) {
      if (file) await fs.unlink(file.path).catch(console.error);
      throw new Error("Target Invoice not found.");
    }

    if (invoice.status === "VOID") {
      if (file) await fs.unlink(file.path).catch(console.error);
      throw new Error(
        "Cannot process payment. The target invoice has been voided.",
      );
    }

    if (
      activeUser.role === "STAFF" &&
      invoice.branch_id !== activeUser.branchId
    ) {
      if (file) await fs.unlink(file.path).catch(console.error);
      throw new Error(
        "Unauthorized: You cannot process payments for documents outside your assigned branch.",
      );
    }

    const requiresProof = ["GCASH", "MAYA", "BANK_TRANSFER"].includes(
      data.payment_method,
    );
    if (requiresProof && !file) {
      throw new Error(
        `Photo evidence (screenshot/deposit slip) is mandatory for ${data.payment_method} transactions.`,
      );
    }

    if (file) {
      data.proof_of_payment_url = file.path.replace(/\\/g, "/");
    }

    // 2. Execute Atomic Payment Collection
    let retries = 3;
    let result = null;

    while (retries > 0) {
      try {
        result = await PaymentModel.recordPaymentTransaction(
          data,
          activeUser.id,
        );
        break;
      } catch (error) {
        if (
          error.code === "23505" &&
          error.constraint === "payments_payment_number_key"
        ) {
          retries--;
          if (retries === 0) {
            if (file) await fs.unlink(file.path).catch(console.error);
            throw new Error(
              "High system traffic. Failed to generate a unique Payment receipt code.",
            );
          }
        } else {
          if (file) await fs.unlink(file.path).catch(console.error);
          throw error;
        }
      }
    }

    await logSecureAction(
      activeUser.id,
      invoice.branch_id,
      "SALES_PAYMENT_RECORDED",
      "INFO",
      ipAddress,
      "invoices",
      invoice.id,
      { status: invoice.status, previous_amount_paid: invoice.amount_paid },
      {
        payment_number: result.payment.payment_number,
        amount_received: result.payment.amount_received,
        new_invoice_status: result.updatedInvoice.status,
        total_amount_paid: result.updatedInvoice.amount_paid,
        has_proof: !!result.payment.proof_of_payment_url,
      },
    );

    return result;
  }

  static async voidPayment(paymentId, activeUser, ipAddress) {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) throw new Error("Payment record not found.");

    if (
      activeUser.role === "STAFF" &&
      payment.branch_id !== activeUser.branchId
    ) {
      throw new Error("Unauthorized access.");
    }

    const result = await PaymentModel.voidPaymentTransaction(paymentId);

    await logSecureAction(
      activeUser.id,
      payment.branch_id,
      "SALES_PAYMENT_VOIDED",
      "WARNING",
      ipAddress,
      "payments",
      payment.id,
      { status: "VALID", invoice_amount_paid: payment.invoice_total },
      {
        status: "VOID",
        invoice_amount_paid: result.updatedInvoice.amount_paid,
      },
    );

    return result;
  }

  static async getPaymentDetails(id, activeUser) {
    const payment = await PaymentModel.findById(id);
    if (!payment) throw new Error("Payment record not found.");

    if (
      activeUser.role === "STAFF" &&
      payment.branch_id !== activeUser.branchId
    ) {
      throw new Error("Unauthorized access.");
    }
    return payment;
  }

  static async getPayments(
    page = 1,
    limit = 10,
    search = "",
    method = "all",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, payments] = await Promise.all([
      PaymentModel.countFiltered(search, method, branchId),
      PaymentModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        method,
        branchId,
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
}

module.exports = PaymentService;
