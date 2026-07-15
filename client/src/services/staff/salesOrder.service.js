import api from "../api";

export const salesOrderService = {
  getSalesOrders: async (
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    branch = "all",
  ) => {
    try {
      const response = await api.get("/staff/sales-orders", {
        params: { page, limit, search, status, branch },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load sales orders.",
      );
    }
  },

  getSalesOrderDetails: async (id) => {
    try {
      const response = await api.get(`/staff/sales-orders/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to fetch sales order details.",
      );
    }
  },

  createSalesOrder: async (data) => {
    try {
      const response = await api.post("/staff/sales-orders", data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to generate sales order.",
      );
    }
  },

  updateSalesOrder: async (id, updateData) => {
    try {
      const response = await api.patch(`/staff/sales-orders/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to update sales order status.",
      );
    }
  },
};
