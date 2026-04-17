import api from "./api";

const getPortal = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user?.role === "STAFF" ? "staff" : "manager";
};

const workshopService = {
  // --- MECHANICS ---
  // Shared Route (Dynamically routes to /staff/mechanics or /manager/mechanics)
  getMechanics: async () => {
    try {
      const response = await api.get(`/${getPortal()}/mechanics`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch mechanics.",
      );
    }
  },

  // Admin Only: Hire a new mechanic
  createMechanic: async (mechanicData) => {
    try {
      const response = await api.post("/manager/mechanics", mechanicData);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to register mechanic.",
      );
    }
  },

  // Admin Only: Update, Transfer, or Deactivate a mechanic
  updateMechanic: async (id, updates) => {
    try {
      const response = await api.put(`/manager/mechanics/${id}`, updates);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update mechanic.",
      );
    }
  },

  // --- SERVICES / COMBO MEALS  ---
  // Shared Route
  getServices: async () => {
    try {
      const response = await api.get(`/${getPortal()}/services`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch services.",
      );
    }
  },

  // Admin Only
  createService: async (serviceData) => {
    try {
      const response = await api.post("/manager/services", serviceData);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to create service package.",
      );
    }
  },

  // Admin Only
  updateService: async (id, updates) => {
    try {
      const response = await api.put(`/manager/services/${id}`, updates);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to update service package.",
      );
    }
  },

  // --- INVENTORY HELPER (For the Dropdown) ---
  getInventory: async () => {
    try {
      const portal = getPortal();
      const endpoint =
        portal === "staff" ? "/staff/inventory/master" : "/manager/inventory";
      const response = await api.get(endpoint);
      return response.data.data;
    } catch (error) {
      console.warn("Inventory API not ready yet or failed:", error);
      return []; // Return empty array so UI doesn't crash
    }
  },
};

export default workshopService;
