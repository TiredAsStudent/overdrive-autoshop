import api from "../api";

export const paymentService = {
  getPayments: async (
    page = 1,
    limit = 10,
    search = "",
    method = "all",
    branch = "all",
  ) => {
    try {
      const response = await api.get("/staff/payments", {
        params: { page, limit, search, method, branch },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load payment ledger.",
      );
    }
  },

  getPaymentDetails: async (id) => {
    try {
      const response = await api.get(`/staff/payments/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to fetch payment details.",
      );
    }
  },

  recordPayment: async (data) => {
    try {
      const payload = {
        ...data,
        amount_received: parseFloat(data.amount_received),
      };
      const response = await api.post("/staff/payments", payload);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to record payment.",
      );
    }
  },

  voidPayment: async (id) => {
    try {
      const response = await api.patch(`/staff/payments/${id}/void`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to void payment.",
      );
    }
  },
};
