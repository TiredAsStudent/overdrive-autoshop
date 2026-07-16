import api from "../api";

export const purchaseOrderService = {
  getPurchaseOrders: async (
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    vendorId = "all",
    branchId = "all",
  ) => {
    try {
      const response = await api.get("/staff/purchase-orders", {
        params: {
          page,
          limit,
          search,
          status,
          vendor: vendorId,
          branch: branchId,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load purchase orders.",
      );
    }
  },

  getPurchaseOrderDetails: async (id) => {
    try {
      const response = await api.get(`/staff/purchase-orders/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load purchase order details.",
      );
    }
  },

  createPurchaseOrder: async (poData) => {
    try {
      const response = await api.post("/staff/purchase-orders", poData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to draft purchase order.",
      );
    }
  },

  updatePurchaseOrder: async (id, poData) => {
    try {
      const response = await api.put(`/staff/purchase-orders/${id}`, poData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to update purchase order.",
      );
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await api.patch(`/staff/purchase-orders/${id}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to update purchase order status.",
      );
    }
  },
};
