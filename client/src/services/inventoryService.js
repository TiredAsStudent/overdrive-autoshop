import api from "./api";

const getPortal = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user?.role === "STAFF" ? "staff" : "manager";
};

const inventoryService = {
  // Get Master Inventory List
  getInventory: async () => {
    try {
      const portal = getPortal();
      // Staff uses the "master" endpoint inside their portal, Manager uses the root
      const endpoint =
        portal === "staff" ? "/staff/inventory/master" : "/manager/inventory";
      const response = await api.get(endpoint);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch inventory.",
      );
    }
  },

  // --- STAFF SPECIFIC ROUTES ---
  getLocalStock: async (searchTerm = "") => {
    try {
      const url = searchTerm
        ? `/staff/inventory/local?search=${searchTerm}`
        : `/staff/inventory/local`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch local stock.",
      );
    }
  },

  getGlobalStock: async (inventoryId) => {
    try {
      const response = await api.get(`/staff/inventory/${inventoryId}/global`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch global stock.",
      );
    }
  },

  // --- MANAGER SPECIFIC ROUTES ---
  createInventoryItem: async (itemData) => {
    try {
      const response = await api.post("/manager/inventory", itemData);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to create item.",
      );
    }
  },

  updateInventoryItem: async (id, updates) => {
    try {
      const response = await api.put(`/manager/inventory/${id}`, updates);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update item.",
      );
    }
  },
};

export default inventoryService;
