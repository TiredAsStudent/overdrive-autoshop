import api from "../api";

export const branchApi = {
  // Fetch all active branches
  getAllBranches: async () => {
    try {
      const response = await api.get("/sysadmin/branches");
      return response.data; // Returns { success, message, data: [...] }
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load branches.";
      throw new Error(message);
    }
  },

  // Create a new branch
  createBranch: async (branchData) => {
    try {
      const response = await api.post("/sysadmin/branches", branchData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to create branch.";
      throw new Error(message);
    }
  },

  // Update branch details (Legal Identity, etc.)
  updateBranch: async (id, branchData) => {
    try {
      const response = await api.put(`/sysadmin/branches/${id}`, branchData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to update branch details.";
      throw new Error(message);
    }
  },

  // Soft delete a branch
  deleteBranch: async (id) => {
    try {
      const response = await api.delete(`/sysadmin/branches/${id}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to delete branch.";
      throw new Error(message);
    }
  },

  // The Security Kill-Switch
  toggleMaintenance: async (id, isMaintenanceMode) => {
    try {
      const response = await api.patch(`/sysadmin/branches/${id}/maintenance`, {
        is_maintenance_mode: isMaintenanceMode,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to toggle maintenance mode.";
      throw new Error(message);
    }
  },
};
