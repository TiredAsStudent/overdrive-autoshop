import api from "../api";

export const inventoryService = {
  getSystemMarkup: async () => {
    try {
      const response = await api.get("/manager/inventory/settings/markup");
      return response.data;
    } catch (error) {
      throw new Error("Failed to load pricing logic.");
    }
  },

  getOverview: async (branchId = null, showArchived = false) => {
    try {
      let url = `/manager/inventory?archived=${showArchived}`;
      if (branchId) url += `&branch_id=${branchId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load stock overview.",
      );
    }
  },

  getActiveBranches: async () => {
    try {
      const response = await api.get("/manager/branches/active");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load branches.",
      );
    }
  },

  createItem: async (itemData) => {
    try {
      const response = await api.post("/manager/inventory", itemData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.details || "Failed to create part.",
      );
    }
  },

  updateItem: async (id, itemData) => {
    try {
      const response = await api.put(`/manager/inventory/${id}`, itemData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.details || "Failed to update part.",
      );
    }
  },
};
