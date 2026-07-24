import api from "../api";

export const inventoryService = {
  getInventory: async (
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    stockStatus = "all",
  ) => {
    try {
      const response = await api.get("/staff/inventory", {
        params: {
          page,
          limit,
          search,
          category,
          stock_status: stockStatus,
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to load branch inventory.";
      throw new Error(message);
    }
  },

  getItemDetails: async (id) => {
    try {
      const response = await api.get(`/staff/inventory/${id}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message || "Failed to load item details.";
      throw new Error(message);
    }
  },

  getMovementHistory: async (id) => {
    try {
      const response = await api.get(`/staff/inventory/${id}/movements`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to load movement ledger.";
      throw new Error(message);
    }
  },
};
