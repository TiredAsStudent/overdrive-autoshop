const PaymentModel = require("../../models/Payment");
const InvoiceModel = require("../../models/Invoice");
const { logSecureAction } = require("../../utils/auditLogger");

class PaymentService {
  static async recordPayment(data, activeUser, ipAddress) {
    // 1. Initial Validation & Security (BR-09)
    const invoice = await InvoiceModel.findById(data.invoice_id);
    if (!invoice) throw new Error("Target Invoice not found.");

    if (
      activeUser.role === "STAFF" &&
      invoice.branch_id !== activeUser.branchId
    ) {
      throw new Error(
        "Unauthorized: You cannot process payments for documents outside your assigned branch.",
      );
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
          if (retries === 0)
            throw new Error(
              "High system traffic. Failed to generate a unique Payment receipt code.",
            );
        } else {
          throw error;
        }
      }
    }

    // 3. Issue the Financial Audit Log (BR-10)
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
