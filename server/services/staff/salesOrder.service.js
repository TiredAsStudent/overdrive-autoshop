const SalesOrderModel = require("../../models/SalesOrder");
const EstimateModel = require("../../models/Estimate");
const { logSecureAction } = require("../../utils/auditLogger");
const { query } = require("../../config/db");

class SalesOrderService {
  static async createSalesOrder(data, activeUser, ipAddress) {
    const estimate = await EstimateModel.findById(data.estimate_id);
    if (!estimate) throw new Error("Source Estimate not found.");

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
          );
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

    const currentStatus = so.status;
    const newStatus = data.status;

    if (
      currentStatus === "INVOICED" ||
      currentStatus === "CANCELLED" ||
      currentStatus === "COMPLETED"
    ) {
      if (newStatus && newStatus !== currentStatus) {
        throw new Error(
          `Sales Order is locked. You cannot change the status of a ${currentStatus} document.`,
        );
      }
    }

    let updated;

    if (newStatus && newStatus !== currentStatus) {
      const validTransitions = {
        PENDING_SERVICE: ["IN_PROGRESS", "CANCELLED"],
        IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      };

      if (
        !validTransitions[currentStatus] ||
        !validTransitions[currentStatus].includes(newStatus)
      ) {
        throw new Error(
          `Illegal Operation: Cannot transition Sales Order from ${currentStatus} directly to ${newStatus}.`,
        );
      }

      if (newStatus === "IN_PROGRESS") {
        const parts = so.items.filter((item) => item.line_type === "PART");

        for (const part of parts) {
          const stockSql = `SELECT quantity FROM branch_inventory WHERE branch_id = $1 AND item_id = $2`;
          const stockResult = await query(stockSql, [
            so.branch_id,
            part.item_id,
          ]);

          const availableStock =
            stockResult.rows.length > 0 ? stockResult.rows[0].quantity : 0;

          if (availableStock < part.quantity) {
            throw new Error(
              `Stock Shortage: Cannot start service. Insufficient inventory for "${part.item_name}". Required: ${part.quantity}, Available: ${availableStock}.`,
            );
          }
        }

        updated = await SalesOrderModel.transitionToInProgress(
          id,
          data,
          parts,
          so.branch_id,
          activeUser.id,
        );
      } else {
        if (newStatus === "COMPLETED") {
          data.completed_at = new Date().toISOString();
        }
        updated = await SalesOrderModel.update(id, data);
      }
    } else {
      updated = await SalesOrderModel.update(id, data);
    }

    await logSecureAction(
      activeUser.id,
      activeUser.branchId,
      "SALES_ORDER_UPDATED",
      "WARNING",
      ipAddress,
      "sales_orders",
      id,
      {
        status: currentStatus,
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
