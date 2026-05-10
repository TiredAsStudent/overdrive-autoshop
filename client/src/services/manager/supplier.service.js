import api from "../api";

export const managerSupplierService = {
  // 1. Fetch the Aggregated Ledger (with Lifetime Purchases)
  getLedger: async (showArchived = false) => {
    try {
      const response = await api.get(
        `/manager/suppliers/ledger?archived=${showArchived}`,
      );
      return response.data; // { success, data: [...] }
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load Supplier Ledger.",
      );
    }
  },

  // 2. Fetch the Transaction Timeline for a specific vendor
  getTimeline: async (id) => {
    try {
      const response = await api.get(`/manager/suppliers/${id}/timeline`);
      return response.data; // { success, data: { supplier, timeline } }
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load transaction timeline.",
      );
    }
  },

  // 3. Create a new Supplier
  createSupplier: async (data) => {
    try {
      const response = await api.post("/manager/suppliers", data);
      return response.data;
    } catch (error) {
      const msg =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        "Failed to create supplier.";
      throw new Error(
        Array.isArray(msg) ? msg.map((m) => m.message).join(" | ") : msg,
      );
    }
  },

  // 4. Update / Archive an existing Supplier
  updateSupplier: async (id, data) => {
    try {
      const response = await api.put(`/manager/suppliers/${id}`, data);
      return response.data;
    } catch (error) {
      const msg =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        "Failed to update supplier.";
      throw new Error(
        Array.isArray(msg) ? msg.map((m) => m.message).join(" | ") : msg,
      );
    }
  },
};
