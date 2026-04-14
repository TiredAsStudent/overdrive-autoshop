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
};

export default workshopService;
