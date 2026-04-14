import api from "./api";

const workshopService = {
  // Get all mechanics (Admin sees all, Staff sees branch-locked)
  getMechanics: async () => {
    try {
      const response = await api.get("/workshop/mechanics");
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
      const response = await api.post("/workshop/mechanics", mechanicData);
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
      const response = await api.put(`/workshop/mechanics/${id}`, updates);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update mechanic.",
      );
    }
  },

  // --- SERVICES / COMBO MEALS  ---
  getServices: async () => {
    try {
      const response = await api.get("/workshop/services");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch services.",
      );
    }
  },
  createService: async (serviceData) => {
    try {
      const response = await api.post("/workshop/services", serviceData);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to create service package.",
      );
    }
  },
  updateService: async (id, updates) => {
    try {
      const response = await api.put(`/workshop/services/${id}`, updates);
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
      // Assuming you will build this route next.
      // For testing, if the route doesn't exist yet, we will catch it gracefully.
      const response = await api.get("/inventory");
      return response.data.data;
    } catch (error) {
      console.warn("Inventory API not ready yet or failed:", error);
      return []; // Return empty array so UI doesn't crash
    }
  },
};

export default workshopService;
