const PurchaseOrderModel = require("../../models/PurchaseOrder");
const VendorModel = require("../../models/Vendor");
const InventoryModel = require("../../models/Inventory");
const SystemSetting = require("../../models/SystemSetting");
const { logSecureAction } = require("../../utils/auditLogger");

class PurchaseOrderService {
  static async _formulateFinancials(vendorId, itemsArray) {
    const vendor = await VendorModel.findById(vendorId);
    if (!vendor || !vendor.is_active)
      throw new Error("The selected vendor is invalid or inactive.");

    const settings = await SystemSetting.getSettings();
    const vatRate = vendor.is_vat_registered
      ? parseFloat(settings.vat_percentage) / 100
      : 0; // VR-07

    let subtotal = 0;
    const computedItems = [];

    for (const item of itemsArray) {
      // Validate Item Master Linkage if applicable
      if (item.line_type === "PART") {
        const partRec = await InventoryModel.findById(item.item_id);
        if (!partRec || !partRec.is_active)
          throw new Error(`Part ID ${item.item_id} is invalid or inactive.`);
      }

      const cost = parseFloat(item.recorded_unit_cost);
      const qty = parseInt(item.quantity, 10);
      const discount = parseFloat(item.discount_amount || 0);

      const lineGross = cost * qty;
      if (discount > lineGross)
        throw new Error(
          "Discount amount cannot exceed the total line item value.",
        );

      const lineNet = lineGross - discount;
      subtotal += lineNet;

      computedItems.push({
        line_type: item.line_type,
        item_id: item.line_type === "PART" ? item.item_id : null,
        sublet_description:
          item.line_type === "SUBLET" ? item.sublet_description : null,
        quantity: qty,
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

  static async createPurchaseOrder(data, activeUser, ipAddress) {
    // Delivery Date verification (VR-06)
    const deliveryDate = new Date(data.expected_delivery_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deliveryDate < today)
      throw new Error("The Expected Delivery Date cannot be in the past.");

    const branchId =
      activeUser.role === "STAFF" ? activeUser.branchId : activeUser.branchId;
    if (!branchId) throw new Error("A valid branch context is required.");

    // Formulate Line Items & Financials
    const { computedItems, financials } = await this._formulateFinancials(
      data.vendor_id,
      data.items,
    );

    const poPayload = {
      vendor_id: data.vendor_id,
      branch_id: branchId,
      ...financials,
      status: data.is_submitting ? "PENDING_APPROVAL" : "DRAFT",
      expected_delivery_date: data.expected_delivery_date,
      notes: data.notes,
      created_by: activeUser.id,
    };

    let retries = 3;
    let newPO = null;

    while (retries > 0) {
      try {
        poPayload.purchase_order_number =
          await PurchaseOrderModel.generatePOCode();
        newPO = await PurchaseOrderModel.createTransaction(
          poPayload,
          computedItems,
        );
        break;
      } catch (error) {
        if (
          error.code === "23505" &&
          error.constraint === "purchase_orders_purchase_order_number_key"
        ) {
          retries--;
          if (retries === 0)
            throw new Error(
              "High traffic. Failed to generate a unique PO code.",
            );
        } else {
          throw error;
        }
      }
    }

    await logSecureAction(
      activeUser.id,
      branchId,
      "PURCHASE_ORDER_CREATED",
      "INFO",
      ipAddress,
      "purchase_orders",
      newPO.id,
      null,
      {
        po_number: newPO.purchase_order_number,
        grand_total: newPO.grand_total,
        status: newPO.status,
      },
    );

    return newPO;
  }

  static async updatePurchaseOrder(id, data, activeUser, ipAddress) {
    const oldPO = await PurchaseOrderModel.findById(id);
    if (!oldPO) throw new Error("Purchase Order not found.");

    if (
      activeUser.role === "STAFF" &&
      oldPO.branch_id !== activeUser.branchId
    ) {
      throw new Error(
        "Unauthorized: Cannot modify a document outside your branch.",
      );
    }

    // BR-05: Editing Lock
    if (!["DRAFT", "REJECTED"].includes(oldPO.status)) {
      throw new Error(
        `Document Locked: You cannot modify a PO that is currently ${oldPO.status}.`,
      );
    }

    let computedItems = [];
    let financials = {
      subtotal: oldPO.subtotal,
      vat_amount: oldPO.vat_amount,
      grand_total: oldPO.grand_total,
    };

    if (data.items && data.items.length > 0) {
      const result = await this._formulateFinancials(
        oldPO.vendor_id,
        data.items,
      );
      computedItems = result.computedItems;
      financials = result.financials;
    }

    const payload = {
      ...financials,
      expected_delivery_date:
        data.expected_delivery_date || oldPO.expected_delivery_date,
      notes: data.notes !== undefined ? data.notes : oldPO.notes,
    };

    const updatedPO = await PurchaseOrderModel.updateTransaction(
      id,
      payload,
      computedItems,
    );

    await logSecureAction(
      activeUser.id,
      oldPO.branch_id,
      "PURCHASE_ORDER_UPDATED",
      "WARNING",
      ipAddress,
      "purchase_orders",
      id,
      { grand_total: oldPO.grand_total },
      { grand_total: updatedPO.grand_total },
    );

    return updatedPO;
  }

  static async updateStatus(id, newStatus, activeUser, ipAddress) {
    const po = await PurchaseOrderModel.findById(id);
    if (!po) throw new Error("Purchase Order not found.");

    if (activeUser.role === "STAFF" && po.branch_id !== activeUser.branchId)
      throw new Error("Unauthorized.");

    // Staff can only submit or cancel drafts. Manager approvals are handled in a different module.
    if (
      newStatus === "PENDING_APPROVAL" &&
      !["DRAFT", "REJECTED"].includes(po.status)
    ) {
      throw new Error(
        "Only Draft or Rejected orders can be submitted for approval.",
      );
    }

    const updated = await PurchaseOrderModel.updateStatus(id, newStatus);

    await logSecureAction(
      activeUser.id,
      activeUser.branchId,
      "PO_STATUS_TRANSITION",
      "INFO",
      ipAddress,
      "purchase_orders",
      id,
      { status: po.status },
      { status: newStatus },
    );

    return updated;
  }

  static async getPurchaseOrderDetails(id, activeUser) {
    const po = await PurchaseOrderModel.findById(id);
    if (!po) throw new Error("Purchase Order not found.");

    if (activeUser.role === "STAFF" && po.branch_id !== activeUser.branchId) {
      throw new Error("Unauthorized: Cross-branch view restricted.");
    }
    return po;
  }

  static async getPurchaseOrders(
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    vendorId = "all",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, purchaseOrders] = await Promise.all([
      PurchaseOrderModel.countFiltered(search, status, vendorId, branchId),
      PurchaseOrderModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        status,
        vendorId,
        branchId,
      ),
    ]);

    return {
      purchaseOrders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}

module.exports = PurchaseOrderService;
