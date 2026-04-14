import api from "./api";

const auditLogService = {
  getLogs: async (filters = {}) => {
    try {
      // Axios automatically serializes the filters object into query parameters
      // e.g., ?page=1&limit=20&search=ABC
      const response = await api.get("/control-center/logs", {
        params: filters,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load activity logs.",
      );
    }
  },
};

export default auditLogService;
