import api from "../api";

export const catalogService = {
  getInventoryCatalog: async (
    page = 1,
    limit = 1000,
    search = "",
    category = "all",
    branch = "all",
    status = "active",
  ) => {
    try {
      const response = await api.get("/staff/inventory", {
        params: { page, limit, search, category, branch, status },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load inventory catalog.",
      );
    }
  },

  getSettings: async () => {
    try {
      const response = await api.get("/staff/settings");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load system settings.",
      );
    }
  },
};
