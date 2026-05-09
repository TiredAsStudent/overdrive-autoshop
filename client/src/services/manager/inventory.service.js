import api from "../api";

export const inventoryService = {
  // Fetch stock (Consolidated or Branch-Specific)
  getOverview: async (branchId = null) => {
    try {
      const url = branchId
        ? `/manager/inventory?branch_id=${branchId}`
        : "/manager/inventory";
      const response = await api.get(url);
      return response.data; // { success, message, data: [...] }
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to load stock overview.";
      throw new Error(message);
    }
  },

  getActiveBranches: async () => {
    try {
      const response = await api.get("/manager/branches/active");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message || "Failed to load branches.";
      throw new Error(message);
    }
  },

  // Create a new master part
  createItem: async (itemData) => {
    try {
      const response = await api.post("/manager/inventory", itemData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        "Failed to create inventory item.";
      throw new Error(message);
    }
  },
};
