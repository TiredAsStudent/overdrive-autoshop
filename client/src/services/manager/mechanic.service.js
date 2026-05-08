import api from "../api";

export const mechanicService = {
  getManagerBranches: async () => {
    try {
      const response = await api.get("/manager/branches/active");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load branches.";
      throw new Error(message);
    }
  },

  // Fetch all mechanics
  getAllMechanics: async () => {
    try {
      const response = await api.get("/manager/mechanics");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load Mechanics.";
      throw new Error(message);
    }
  },

  // Enroll a new mechanic
  createMechanic: async (mechanicData) => {
    try {
      const response = await api.post("/manager/mechanics", mechanicData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        "Failed to enroll mechanic.";
      throw new Error(message);
    }
  },

  // Update a mechanic (Profile edits or Branch Transfers)
  updateMechanic: async (id, mechanicData) => {
    try {
      const response = await api.put(`/manager/mechanics/${id}`, mechanicData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        "Failed to update mechanic profile.";
      throw new Error(message);
    }
  },
};
