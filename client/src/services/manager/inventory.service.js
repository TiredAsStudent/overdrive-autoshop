import api from "../api";

export const inventoryService = {
  // Fetch paginated master catalog with aggregated company totals
  getInventoryCatalog: async (
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    status = "all",
  ) => {
    try {
      const response = await api.get("/manager/inventory", {
        params: { page, limit, search, category, status },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load inventory catalog.";
      throw new Error(message);
    }
  },

  // Create a new master item (and trigger auto-distribution)
  createMasterItem: async (itemData) => {
    try {
      const payload = {
        ...itemData,
        unit_cost: parseFloat(itemData.unit_cost),
        selling_price: parseFloat(itemData.selling_price),
      };
      const response = await api.post("/manager/inventory", payload);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to register master item.";
      throw new Error(message);
    }
  },

  // Fetch the stock levels of a specific item across all branches
  getBranchBreakdown: async (itemId) => {
    try {
      const response = await api.get(`/manager/inventory/${itemId}/breakdown`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to extract branch breakdown.";
      throw new Error(message);
    }
  },
};
