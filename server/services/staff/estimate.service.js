const EstimateModel = require("../../models/Estimate");
const CustomerModel = require("../../models/Customer");
const ServiceModel = require("../../models/Service");
const InventoryModel = require("../../models/Inventory");
const SystemSetting = require("../../models/SystemSetting");
const { logSecureAction } = require("../../utils/auditLogger");

class EstimateService {
  // Helper to run zero-trust math
  static async computeMatrix(items) {
    const settings = await SystemSetting.getSettings();
    const vatRate = parseFloat(settings?.vat_percentage || 12) / 100;

    let subtotal = 0;
    let vatableSubtotal = 0;
    let totalDiscount = 0;
    const computedItems = [];

    for (const item of items) {
      let cost = 0,
        price = 0,
        isVatable = true;

      if (item.line_type === "SERVICE") {
        const serviceRec = await ServiceModel.findById(item.service_id);
        if (!serviceRec || !serviceRec.is_active)
          throw new Error(
            `Service ID ${item.service_id} is invalid or inactive.`,
          );
        price = parseFloat(serviceRec.price);
        isVatable = serviceRec.is_vatable;
      } else {
        const partRec = await InventoryModel.findById(item.item_id);
        if (!partRec || !partRec.is_active)
          throw new Error(`Part ID ${item.item_id} is invalid or inactive.`);
        cost = parseFloat(partRec.unit_cost);
        price = parseFloat(partRec.selling_price);
        isVatable = true;
      }

      const lineGross = price * item.quantity;
      const lineDiscount = item.discount || 0;
      if (lineDiscount > lineGross)
        throw new Error("Discount amount cannot exceed line item value.");

      const lineNet = lineGross - lineDiscount;
      subtotal += lineNet;
      totalDiscount += lineDiscount;
      if (isVatable) vatableSubtotal += lineNet;

      computedItems.push({
        line_type: item.line_type,
        service_id: item.service_id || null,
        item_id: item.item_id || null,
        quantity: item.quantity,
        recorded_unit_cost: cost,
        recorded_selling_price: price,
        discount_amount: lineDiscount,
      });
    }

    const vatAmount = vatableSubtotal * vatRate;
    const grandTotal = subtotal + vatAmount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      total_discount: parseFloat(totalDiscount.toFixed(2)),
      vat_amount: parseFloat(vatAmount.toFixed(2)),
      grand_total: parseFloat(grandTotal.toFixed(2)),
      computedItems,
    };
  }

  static async createEstimate(data, activeUser, ipAddress) {
    const branchId =
      activeUser.role === "STAFF"
        ? activeUser.branchId
        : data.branch_id || activeUser.branchId;
    if (!branchId) throw new Error("A valid branch context is required.");

    const customer = await CustomerModel.findById(data.customer_id);
    if (!customer || !customer.is_active)
      throw new Error("A valid, active customer is required.");

    const math = await this.computeMatrix(data.items);

    const estimatePayload = {
      customer_id: data.customer_id,
      branch_id: branchId,
      subtotal: math.subtotal,
      total_discount: math.total_discount,
      vat_amount: math.vat_amount,
      grand_total: math.grand_total,
      valid_until: data.valid_until,
      notes: data.notes,
      terms_conditions: data.terms_conditions,
      created_by: activeUser.id,
    };

    let retries = 3,
      newEstimate = null;
    while (retries > 0) {
      try {
        estimatePayload.estimate_number =
          await EstimateModel.generateEstimateCode();
        newEstimate = await EstimateModel.createTransaction(
          estimatePayload,
          math.computedItems,
        );
        break;
      } catch (error) {
        if (
          error.code === "23505" &&
          error.constraint === "estimates_estimate_number_key"
        ) {
          retries--;
          if (retries === 0)
            throw new Error(
              "High system traffic. Failed to generate quotation code.",
            );
        } else {
          throw error;
        }
      }
    }

    await logSecureAction(
      activeUser.id,
      branchId,
      "ESTIMATE_CREATED",
      "INFO",
      ipAddress,
      "estimates",
      newEstimate.id,
      null,
      {
        estimate_number: newEstimate.estimate_number,
        grand_total: newEstimate.grand_total,
      },
    );
    return newEstimate;
  }

  static async updateEstimate(id, data, activeUser, ipAddress) {
    const existing = await EstimateModel.findById(id);
    if (!existing) throw new Error("Estimate not found.");
    if (
      activeUser.role === "STAFF" &&
      existing.branch_id !== activeUser.branchId
    )
      throw new Error("Unauthorized.");
    if (existing.status !== "DRAFT" && existing.status !== "PENDING_APPROVAL") {
      throw new Error(
        `Estimate is locked. Cannot modify a ${existing.status} document.`,
      );
    }

    const customer = await CustomerModel.findById(data.customer_id);
    if (!customer || !customer.is_active)
      throw new Error("A valid, active customer is required.");

    const math = await this.computeMatrix(data.items);

    const estimatePayload = {
      customer_id: data.customer_id,
      subtotal: math.subtotal,
      total_discount: math.total_discount,
      vat_amount: math.vat_amount,
      grand_total: math.grand_total,
      valid_until: data.valid_until,
      notes: data.notes,
      terms_conditions: data.terms_conditions,
    };

    const updated = await EstimateModel.updateTransaction(
      id,
      estimatePayload,
      math.computedItems,
    );

    await logSecureAction(
      activeUser.id,
      activeUser.branchId,
      "ESTIMATE_UPDATED",
      "INFO",
      ipAddress,
      "estimates",
      id,
      { grand_total: existing.grand_total },
      { grand_total: updated.grand_total },
    );
    return updated;
  }

  static async getEstimateDetails(id, activeUser) {
    const estimate = await EstimateModel.findById(id);
    if (!estimate) throw new Error("Estimate not found.");
    if (
      activeUser.role === "STAFF" &&
      estimate.branch_id !== activeUser.branchId
    )
      throw new Error("Unauthorized.");
    return estimate;
  }

  static async updateEstimateStatus(id, newStatus, activeUser, ipAddress) {
    const estimate = await EstimateModel.findById(id);
    if (!estimate) throw new Error("Estimate not found.");
    if (
      activeUser.role === "STAFF" &&
      estimate.branch_id !== activeUser.branchId
    )
      throw new Error("Unauthorized.");

    if (newStatus === "APPROVED" && estimate.status === "EXPIRED") {
      throw new Error(
        "Cannot approve an expired estimate. Please edit the validity date first.",
      );
    }
    if (estimate.status === "CONVERTED" || estimate.status === "REJECTED") {
      throw new Error(
        `Estimate is locked. You cannot modify a document that is currently ${estimate.status}.`,
      );
    }

    const updated = await EstimateModel.updateStatus(id, newStatus);
    await logSecureAction(
      activeUser.id,
      activeUser.branchId,
      "ESTIMATE_STATUS_UPDATED",
      "WARNING",
      ipAddress,
      "estimates",
      id,
      { status: estimate.status },
      { status: newStatus },
    );
    return updated;
  }

  static async getEstimates(
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;
    const [totalItems, estimates] = await Promise.all([
      EstimateModel.countFiltered(search, status, branchId),
      EstimateModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        status,
        branchId,
      ),
    ]);
    return {
      estimates,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}

module.exports = EstimateService;
