const InvoiceModel = require("../../models/Invoice");
const SalesOrderModel = require("../../models/SalesOrder");
const { logSecureAction } = require("../../utils/auditLogger");

class InvoiceService {
  static async createInvoice(data, activeUser, ipAddress) {
    // 1. Fetch Source Sales Order
    const so = await SalesOrderModel.findById(data.sales_order_id);
    if (!so) throw new Error("Source Sales Order not found.");

    // 2. Validate Rules (VR-01, BR-09, VR-08)
    if (so.status !== "COMPLETED") {
      throw new Error(
        `Cannot invoice this work order. Its current status is ${so.status}. Only COMPLETED orders can be billed.`,
      );
    }

    if (activeUser.role === "STAFF" && so.branch_id !== activeUser.branchId) {
      throw new Error(
        "Unauthorized: You cannot bill documents from another branch.",
      );
    }

    const dueDate = new Date(data.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      throw new Error("The Due Date cannot be in the past.");
    }

    // 3. Map Data (VR-05: Exact copy of financials to prevent tampering)
    const invoicePayload = {
      customer_id: so.customer_id,
      branch_id: so.branch_id,
      subtotal: so.subtotal,
      total_discount: so.total_discount,
      vat_amount: so.vat_amount,
      grand_total: so.grand_total,
      due_date: data.due_date,
      notes: data.notes || null,
      created_by: activeUser.id,
    };

    const itemsData = so.items.map((item) => ({
      line_type: item.line_type,
      service_id: item.service_id,
      item_id: item.item_id,
      quantity: item.quantity,
      recorded_unit_cost: item.recorded_unit_cost,
      recorded_selling_price: item.recorded_selling_price,
      discount_amount: item.discount_amount,
    }));

    // 4. Execute Atomic Billing Conversion
    let retries = 3;
    let newInvoice = null;

    while (retries > 0) {
      try {
        invoicePayload.invoice_number =
          await InvoiceModel.generateInvoiceCode();
        newInvoice = await InvoiceModel.createFromSalesOrder(
          invoicePayload,
          itemsData,
          so.id,
          activeUser.id,
        );
        break;
      } catch (error) {
        if (
          error.code === "23505" &&
          error.constraint === "invoices_sales_order_id_key"
        ) {
          throw new Error(
            "This Sales Order has already been billed. Duplicate invoices are not allowed.",
          ); // VR-03
        }
        if (
          error.code === "23505" &&
          error.constraint === "invoices_invoice_number_key"
        ) {
          retries--;
          if (retries === 0)
            throw new Error(
              "High system traffic. Failed to generate a unique Invoice code.",
            );
        } else {
          throw error;
        }
      }
    }

    await logSecureAction(
      activeUser.id,
      invoicePayload.branch_id,
      "INVOICE_GENERATED",
      "WARNING",
      ipAddress,
      "invoices",
      newInvoice.id,
      { sales_order_source: so.sales_order_number },
      {
        invoice_number: newInvoice.invoice_number,
        grand_total: newInvoice.grand_total,
      },
    );

    return newInvoice;
  }

  static async getInvoiceDetails(id, activeUser) {
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) throw new Error("Invoice not found.");

    if (
      activeUser.role === "STAFF" &&
      invoice.branch_id !== activeUser.branchId
    ) {
      throw new Error("Unauthorized access.");
    }
    return invoice;
  }

  static async updateInvoice(id, data, activeUser, ipAddress) {
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) throw new Error("Invoice not found.");

    if (
      activeUser.role === "STAFF" &&
      invoice.branch_id !== activeUser.branchId
    ) {
      throw new Error("Unauthorized.");
    }

    const updated = await InvoiceModel.update(id, data);

    await logSecureAction(
      activeUser.id,
      activeUser.branchId,
      "INVOICE_METADATA_UPDATED",
      "INFO",
      ipAddress,
      "invoices",
      id,
      { due_date: invoice.due_date },
      { due_date: updated.due_date },
    );

    return updated;
  }

  static async getInvoices(
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, invoices] = await Promise.all([
      InvoiceModel.countFiltered(search, status, branchId),
      InvoiceModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        status,
        branchId,
      ),
    ]);

    return {
      invoices,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}

module.exports = InvoiceService;
