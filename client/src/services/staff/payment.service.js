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

  recordPayment: async (data, proofFile = null) => {
    try {
      const formData = new FormData();
      formData.append("invoice_id", data.invoice_id);
      formData.append("amount_received", data.amount_received);
      formData.append("payment_method", data.payment_method);
      formData.append("payment_date", data.payment_date);

      if (data.reference_number)
        formData.append("reference_number", data.reference_number);
      if (data.notes) formData.append("notes", data.notes);

      if (proofFile) {
        formData.append("proof", proofFile);
      }

      const response = await api.post("/staff/payments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
