const BillModel = require("../../models/Bill");
const PurchaseOrderModel = require("../../models/PurchaseOrder");
const VendorModel = require("../../models/Vendor");
const InventoryModel = require("../../models/Inventory");
const SystemSetting = require("../../models/SystemSetting");
const { logSecureAction } = require("../../utils/auditLogger");

class BillService {
  static async _formulateFinancials(vendorId, itemsArray) {
    const vendor = await VendorModel.findById(vendorId);
    if (!vendor || !vendor.is_active)
      throw new Error("The selected vendor is invalid or inactive.");

    const settings = await SystemSetting.getSettings();
    const vatRate = vendor.is_vat_registered
      ? parseFloat(settings.vat_percentage) / 100
      : 0;

    let subtotal = 0;
    const computedItems = [];

    for (const item of itemsArray) {
      const partRec = await InventoryModel.findById(item.item_id);
      if (!partRec || !partRec.is_active)
        throw new Error(`Part ID ${item.item_id} is invalid or inactive.`);

      const cost = parseFloat(item.recorded_unit_cost);
      const qty = parseInt(item.quantity_received, 10);
      const discount = parseFloat(item.discount_amount || 0);

      const lineGross = cost * qty;
      if (discount > lineGross)
        throw new Error(
          "Discount amount cannot exceed the total line item value.",
        );

      const lineNet = lineGross - discount;
      subtotal += lineNet;

      computedItems.push({
        item_id: item.item_id,
        quantity_received: qty,
        recorded_unit_cost: cost,
        discount_amount: discount,
      });
    }

    const vatAmount = subtotal * vatRate;
    const grandTotal = subtotal + vatAmount;

    return {
      computedItems,
      financials: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        vat_amount: parseFloat(vatAmount.toFixed(2)),
        grand_total: parseFloat(grandTotal.toFixed(2)),
      },
    };
  }

  static async createBill(data, activeUser, ipAddress) {
    const branchId = activeUser.branchId;
    if (!branchId) throw new Error("System Error: Branch context missing.");

    // 1. Verify Parent Purchase Order
    const po = await PurchaseOrderModel.findById(data.purchase_order_id);
    if (!po) throw new Error("Source Purchase Order not found.");
    if (po.status !== "APPROVED")
      throw new Error(
        "Bills can only be created from APPROVED Purchase Orders.",
      );
    if (po.branch_id !== branchId)
      throw new Error(
        "Unauthorized: Purchase Order belongs to a different branch.",
      );

    // 2. Compute Financials
    const { computedItems, financials } = await this._formulateFinancials(
      po.vendor_id,
      data.items,
    );

    const payload = {
      purchase_order_id: po.id,
      vendor_id: po.vendor_id,
      branch_id: branchId,
      vendor_invoice_number: data.vendor_invoice_number,
      bill_date: data.bill_date,
      status: "PENDING_RECEIPT",
      notes: data.notes,
      created_by: activeUser.id,
      ...financials,
    };

    let retries = 3;
    let newBill = null;

    while (retries > 0) {
      try {
        payload.bill_number = await BillModel.generateBillCode();
        newBill = await BillModel.createTransaction(payload, computedItems);
        break;
      } catch (error) {
        if (
          error.code === "23505" &&
          error.constraint === "unique_vendor_invoice_per_vendor"
        ) {
          throw new Error(
            `Vendor Invoice '${data.vendor_invoice_number}' has already been billed for this vendor.`,
          );
        }
        if (
          error.code === "23505" &&
          error.constraint === "bills_purchase_order_id_key"
        ) {
          throw new Error(
            `Purchase Order ${po.purchase_order_number} has already been billed.`,
          );
        }
        if (
          error.code === "23505" &&
          error.constraint === "bills_bill_number_key"
        ) {
          retries--;
          if (retries === 0)
            throw new Error(
              "High system traffic. Failed to generate a unique Bill code.",
            );
        } else {
          throw error;
        }
      }
    }

    // 3. Immediately process inventory if submitted as RECEIVED
    if (data.status === "RECEIVED") {
      newBill = await BillModel.executeReceiptTransaction(
        newBill.id,
        activeUser.id,
      );
    }

    await logSecureAction(
      activeUser.id,
      branchId,
      "SUPPLIER_BILL_CREATED",
      "INFO",
      ipAddress,
      "bills",
      newBill.id,
      null,
      { bill_number: newBill.bill_number, status: newBill.status },
    );

    return newBill;
  }

  static async confirmReceipt(id, activeUser, ipAddress) {
    const bill = await BillModel.findById(id);
    if (!bill) throw new Error("Supplier Bill not found.");
    if (activeUser.role === "STAFF" && bill.branch_id !== activeUser.branchId)
      throw new Error("Unauthorized.");

    const confirmedBill = await BillModel.executeReceiptTransaction(
      id,
      activeUser.id,
    );

    await logSecureAction(
      activeUser.id,
      activeUser.branchId,
      "GOODS_RECEIVED_POSTED",
      "WARNING",
      ipAddress,
      "bills",
      id,
      { status: bill.status },
      { status: confirmedBill.status },
    );

    return confirmedBill;
  }

  static async getBillDetails(id, activeUser) {
    const bill = await BillModel.findById(id);
    if (!bill) throw new Error("Supplier Bill not found.");
    if (activeUser.role === "STAFF" && bill.branch_id !== activeUser.branchId) {
      throw new Error("Unauthorized: Cross-branch view restricted.");
    }
    return bill;
  }

  static async getBills(
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    vendorId = "all",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, bills] = await Promise.all([
      BillModel.countFiltered(search, status, vendorId, branchId),
      BillModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        status,
        vendorId,
        branchId,
      ),
    ]);

    return {
      bills,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}

module.exports = BillService;
