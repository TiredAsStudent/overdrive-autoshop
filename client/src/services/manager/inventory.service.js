import api from "../api";

export const inventoryService = {
  getInventoryCatalog: async (
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    branch = "all",
    status = "all",
    stockStatus = "all",
  ) => {
    try {
      const response = await api.get("/manager/inventory", {
        params: {
          page,
          limit,
          search,
          category,
          branch,
          status,
          stock_status: stockStatus,
        },
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

  createMasterItem: async (itemData) => {
    try {
      const payload = {
        ...itemData,
        unit_cost: parseFloat(itemData.unit_cost),
        selling_price: parseFloat(itemData.selling_price),
        default_reorder_level: parseInt(itemData.default_reorder_level, 10),
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

  updateMasterItem: async (id, itemData) => {
    try {
      const payload = {
        ...itemData,
        unit_cost: parseFloat(itemData.unit_cost),
        selling_price: parseFloat(itemData.selling_price),
        default_reorder_level: parseInt(itemData.default_reorder_level, 10),
      };
      delete payload.sku;

      const response = await api.put(`/manager/inventory/${id}`, payload);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message || "Failed to update item.";
      throw new Error(message);
    }
  },

  toggleItemStatus: async (id, isActive) => {
    try {
      const response = await api.patch(`/manager/inventory/${id}/status`, {
        is_active: isActive,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message || "Failed to update item status.";
      throw new Error(message);
    }
  },

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

  getMovementHistory: async (itemId) => {
    try {
      const response = await api.get(`/manager/inventory/${itemId}/movements`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to extract movement history.";
      throw new Error(message);
    }
  },

  getSystemMarkup: async () => {
    try {
      const response = await api.get("/manager/settings/markup");
      return parseFloat(response.data.data.markup_percentage) || 0;
    } catch (error) {
      return 0;
    }
  },

  getActiveBranches: async () => {
    try {
      const response = await api.get("/manager/branches/active");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch branches for filter:", error);
      return { data: [] };
    }
  },
};
