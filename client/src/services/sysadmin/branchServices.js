import api from "../api";

export const branchApi = {
  // Fetch all active branches
  getAllBranches: async () => {
    const response = await api.get("/sysadmin/branches");
    return response.data; // Returns { success, message, data: [...] }
  },

  // Create a new branch
  createBranch: async (branchData) => {
    const response = await api.post("/sysadmin/branches", branchData);
    return response.data;
  },

  // Update branch details (Legal Identity, etc.)
  updateBranch: async (id, branchData) => {
    const response = await api.put(`/sysadmin/branches/${id}`, branchData);
    return response.data;
  },

  // Soft delete a branch
  deleteBranch: async (id) => {
    const response = await api.delete(`/sysadmin/branches/${id}`);
    return response.data;
  },

  // The Security Kill-Switch
  toggleMaintenance: async (id, isMaintenanceMode) => {
    const response = await api.patch(`/sysadmin/branches/${id}/maintenance`, {
      is_maintenance_mode: isMaintenanceMode,
    });
    return response.data;
  },
};
