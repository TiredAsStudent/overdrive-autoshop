const SalesOrderModel = require("../../models/SalesOrder");
const EstimateModel = require("../../models/Estimate");
const { logSecureAction } = require("../../utils/auditLogger");

class SalesOrderService {
  static async createSalesOrder(data, activeUser, ipAddress) {
    // 1. Fetch Source Estimate
    const estimate = await EstimateModel.findById(data.estimate_id);
    if (!estimate) throw new Error("Source Estimate not found.");

    // 2. Validate Rules (VR-01, BR-08)
    if (estimate.status !== "APPROVED") {
      throw new Error(
        `Cannot convert this estimate. Its current status is ${estimate.status}. Only APPROVED estimates can be converted.`,
      );
    }

    if (
      activeUser.role === "STAFF" &&
      estimate.branch_id !== activeUser.branchId
    ) {
      throw new Error(
        "Unauthorized: You cannot convert documents from another branch.",
      );
    }

    // 3. Map Data (VR-05: Exact copy of financials to prevent tampering)
    const soPayload = {
      customer_id: estimate.customer_id,
      branch_id: estimate.branch_id,
      subtotal: estimate.subtotal,
      total_discount: estimate.total_discount,
      vat_amount: estimate.vat_amount,
      grand_total: estimate.grand_total,
      estimated_completion_date: data.estimated_completion_date || null,
      notes: data.notes || null,
      created_by: activeUser.id,
    };

    const itemsData = estimate.items.map((item) => ({
      line_type: item.line_type,
      service_id: item.service_id,
      item_id: item.item_id,
      quantity: item.quantity,
      recorded_unit_cost: item.recorded_unit_cost,
      recorded_selling_price: item.recorded_selling_price,
      discount_amount: item.discount_amount,
    }));

    // 4. Execute Atomic Conversion
    let retries = 3;
    let newSO = null;

    while (retries > 0) {
      try {
        soPayload.sales_order_number =
          await SalesOrderModel.generateSalesOrderCode();
        newSO = await SalesOrderModel.createFromEstimate(
          soPayload,
          itemsData,
          estimate.id,
        );
        break;
      } catch (error) {
        if (
          error.code === "23505" &&
          error.constraint === "sales_orders_estimate_id_key"
        ) {
          throw new Error(
            "This Estimate has already been converted into a Sales Order.",
          ); // VR-03
        }
        if (
          error.code === "23505" &&
          error.constraint === "sales_orders_sales_order_number_key"
        ) {
          retries--;
          if (retries === 0)
            throw new Error(
              "High system traffic. Failed to generate a unique SO code.",
            );
        } else {
          throw error;
        }
      }
    }

    await logSecureAction(
      activeUser.id,
      soPayload.branch_id,
      "SALES_ORDER_GENERATED",
      "INFO",
      ipAddress,
      "sales_orders",
      newSO.id,
      { estimate_source: estimate.estimate_number },
      { sales_order_number: newSO.sales_order_number },
    );

    return newSO;
  }

  static async getSalesOrderDetails(id, activeUser) {
    const so = await SalesOrderModel.findById(id);
    if (!so) throw new Error("Sales Order not found.");

    if (activeUser.role === "STAFF" && so.branch_id !== activeUser.branchId) {
      throw new Error("Unauthorized access.");
    }
    return so;
  }

  static async updateSalesOrder(id, data, activeUser, ipAddress) {
    const so = await SalesOrderModel.findById(id);
    if (!so) throw new Error("Sales Order not found.");

    if (activeUser.role === "STAFF" && so.branch_id !== activeUser.branchId) {
      throw new Error("Unauthorized.");
    }

    if (so.status === "INVOICED" || so.status === "CANCELLED") {
      throw new Error(`Sales Order is locked. It is currently ${so.status}.`);
    }

    const updated = await SalesOrderModel.update(id, data);

    await logSecureAction(
      activeUser.id,
      activeUser.branchId,
      "SALES_ORDER_UPDATED",
      "WARNING",
      ipAddress,
      "sales_orders",
      id,
      {
        status: so.status,
        estimated_completion_date: so.estimated_completion_date,
      },
      {
        status: updated.status,
        estimated_completion_date: updated.estimated_completion_date,
      },
    );

    return updated;
  }

  static async getSalesOrders(
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, salesOrders] = await Promise.all([
      SalesOrderModel.countFiltered(search, status, branchId),
      SalesOrderModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        status,
        branchId,
      ),
    ]);

    return {
      salesOrders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}

module.exports = SalesOrderService;
