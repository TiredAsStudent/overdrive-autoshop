import api from "./api";

const staffJobCardService = {
  getBoard: async () => {
    try {
      const response = await api.get("/staff/jobs/board");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load board.",
      );
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await api.patch(`/staff/jobs/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update status.",
      );
    }
  },

  assignMechanic: async (id, mechanic_id) => {
    try {
      const response = await api.patch(`/staff/jobs/${id}/mechanic`, {
        mechanic_id: mechanic_id ? parseInt(mechanic_id) : null,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to assign mechanic.",
      );
    }
  },

  updateDiagnosis: async (id, diagnostic_notes) => {
    try {
      const response = await api.patch(`/staff/jobs/${id}/diagnosis`, {
        diagnostic_notes,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update diagnosis.",
      );
    }
  },
};

export default staffJobCardService;
