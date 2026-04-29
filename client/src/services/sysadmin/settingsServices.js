import api from "../api";

export const settingsApi = {
  getSettings: async () => {
    try {
      const response = await api.get("/sysadmin/settings");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load settings.";
      throw new Error(message);
    }
  },

  updateSettings: async (formData) => {
    try {
      const response = await api.put("/sysadmin/settings", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details || // Grabs Zod details if they exist
        error.response?.data?.error?.message ||
        "Failed to update settings.";
      throw new Error(message);
    }
  },
};
