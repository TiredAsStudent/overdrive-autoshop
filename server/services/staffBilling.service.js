const BillingModel = require("../models/Billing");
const { logSecureAction } = require("../utils/auditLogger");

class StaffBillingService {
  static async getActiveSalesOrders(branchId) {
    if (!branchId) throw new Error("Branch context missing.");
    return await BillingModel.getSalesOrders(branchId);
  }

  static async getFinalizedInvoices(branchId) {
    if (!branchId) throw new Error("Branch context missing.");
    return await BillingModel.getInvoices(branchId);
  }

  static async cancelOrder(transactionId, staffUser, ipAddress) {
    const success = await BillingModel.cancelSalesOrder(
      transactionId,
      staffUser.branchId,
    );

    if (success) {
      await logSecureAction(
        staffUser.id,
        staffUser.branchId,
        "SALES_ORDER_CANCELLED",
        "WARNING",
        ipAddress,
        "billing_transactions",
        transactionId,
        { status: "APPROVED", inventory: "RESERVED" },
        { status: "CANCELLED", inventory: "RELEASED" },
      );
    }
    return success;
  }

  static async finalizePayment(
    transactionId,
    paymentData,
    staffUser,
    ipAddress,
  ) {
    // Basic verification of payload
    if (!paymentData.method) throw new Error("Payment method is required.");
    if (
      paymentData.method !== "CASH" &&
      (!paymentData.reference || paymentData.reference.length < 5)
    ) {
      throw new Error("Digital payments require a valid reference number.");
    }

    const result = await BillingModel.finalizeInvoice(
      transactionId,
      staffUser.branchId,
      paymentData,
      staffUser.id,
    );

    // Write to Immutable Audit Trail
    await logSecureAction(
      staffUser.id,
      staffUser.branchId,
      "INVOICE_FINALIZED",
      "INFO",
      ipAddress,
      "billing_transactions",
      transactionId,
      null,
      {
        invoice_ref: result.invoiceRef,
        amount: result.totalAmount,
        method: paymentData.method,
        cogs_tracked: result.cogsTracked,
      },
    );

    return result;
  }
}

module.exports = StaffBillingService;
