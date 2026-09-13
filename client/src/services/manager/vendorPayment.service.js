import api from "../api";

export const vendorPaymentService = {
  getPayments: async (
    page = 1,
    limit = 10,
    search = "",
    method = "all",
    branch = "all",
    vendor = "all",
  ) => {
    try {
      const response = await api.get("/manager/vendor-payments", {
        params: { page, limit, search, method, branch, vendor },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load AP ledger.",
      );
    }
  },

  getPaymentDetails: async (id) => {
    try {
      const response = await api.get(`/manager/vendor-payments/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to fetch disbursement details.",
      );
    }
  },

  getEligibleBills: async (vendorId) => {
    try {
      const response = await api.get(
        `/manager/vendor-payments/eligible-bills/${vendorId}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load outstanding vendor bills.",
      );
    }
  },

  recordPayment: async (data, proofFile = null) => {
    try {
      const formData = new FormData();
      formData.append("vendor_id", data.vendor_id);
      formData.append("bill_id", data.bill_id);
      formData.append("amount_paid", data.amount_paid);
      formData.append("payment_method", data.payment_method);
      formData.append("payment_date", data.payment_date);

      if (data.reference_number)
        formData.append("reference_number", data.reference_number);
      if (data.notes) formData.append("notes", data.notes);

      if (proofFile) {
        formData.append("proof", proofFile);
      }

      const response = await api.post("/manager/vendor-payments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to record vendor disbursement.",
      );
    }
  },
};
