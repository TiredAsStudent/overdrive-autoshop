import api from "../api";

export const expenseService = {
  // Fetch the queue of pending OCR scans
  getPending: async (branchId = "") => {
    try {
      const response = await api.get(
        `/manager/expenses/pending?branch_id=${branchId}`,
      );
      return response.data; // { success, data: [...] }
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load pending expenses.",
      );
    }
  },

  // The Maker-Checker "Approve" (Triggers the Atomic SQL Transaction)
  approve: async (id, data) => {
    try {
      const response = await api.post(`/manager/expenses/${id}/approve`, data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to approve expense.",
      );
    }
  },

  // The Maker-Checker "Reject" (Sends it back to the staff with a reason)
  reject: async (id, reason) => {
    try {
      const response = await api.post(`/manager/expenses/${id}/reject`, {
        rejection_reason: reason,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to reject expense.",
      );
    }
  },

  // Helper: Fetch suppliers for auto-mapping
  getSuppliers: async () => {
    try {
      // Assuming a global route or manager route for suppliers
      const response = await api.get("/manager/suppliers/active");
      return response.data;
    } catch (error) {
      console.warn("Supplier fetch failed.", error);
      return { data: [] };
    }
  },

  // Fetch active branches for the dynamic dropdown
  getActiveBranches: async () => {
    try {
      const response = await api.get("/manager/branches/active");
      return response.data;
    } catch (error) {
      console.warn("Branch fetch failed.", error);
      return { data: [] };
    }
  },
};
