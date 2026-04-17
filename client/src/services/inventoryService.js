import api from "./api";

const inventoryService = {
  getInventory: async () => {
    try {
      const response = await api.get("/inventory");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch inventory.",
      );
    }
  },

  createInventoryItem: async (itemData) => {
    try {
      const response = await api.post("/inventory", itemData);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to create item.",
      );
    }
  },

  updateInventoryItem: async (id, updates) => {
    try {
      const response = await api.put(`/inventory/${id}`, updates);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update item.",
      );
    }
  },
};

export default inventoryService;
