import api from "../api";

export const billService = {
  getEligiblePOs: async () => {
    try {
      const response = await api.get(
        "/staff/purchase-orders/eligible-for-billing",
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load eligible purchase orders.",
      );
    }
  },

  getBills: async (
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    vendorId = "all",
    branchId = "all",
  ) => {
    try {
      const response = await api.get("/staff/bills", {
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
          "Failed to load supplier bills.",
      );
    }
  },

  getBillDetails: async (id) => {
    try {
      const response = await api.get(`/staff/bills/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load bill details.",
      );
    }
  },

  createBill: async (billData) => {
    try {
      const response = await api.post("/staff/bills", billData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to create supplier bill.",
      );
    }
  },

  confirmReceipt: async (id) => {
    try {
      const response = await api.patch(`/staff/bills/${id}/receive`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to confirm goods receipt.",
      );
    }
  },
};
